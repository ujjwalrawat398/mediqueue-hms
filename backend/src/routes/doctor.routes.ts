import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireRole("DOCTOR"));

// -------------------------------------------------------------
// GET /api/doctor/patients/search?q=name-or-patientCode-or-phone
// Doctor "usse uska name puche" -> types it here to pull up the record.
// -------------------------------------------------------------
router.get("/patients/search", async (req, res) => {
  const q = (req.query.q as string) || "";
  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { patientCode: { contains: q, mode: "insensitive" } },
        { user: { phone: { contains: q } } },
      ],
    },
    take: 10,
    select: { id: true, patientCode: true, fullName: true, dob: true, gender: true },
  });
  res.json(patients);
});

// -------------------------------------------------------------
// GET /api/doctor/patients/:patientId/history
// THE core feature: "puri medical history" -- every past visit,
// which doctors, what was diagnosed, what medicines were given.
// -------------------------------------------------------------
router.get("/patients/:patientId/history", async (req, res) => {
  const { patientId } = req.params;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      visits: {
        orderBy: { visitDate: "desc" },
        include: {
          doctor: { select: { fullName: true, department: { select: { name: true } } } },
          prescription: {
            include: { items: { include: { medicine: true } } },
          },
          reports: true,
        },
      },
      reports: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!patient) return res.status(404).json({ error: "Patient not found" });

  // Log access for audit trail (medical data access must be traceable)
  await prisma.auditLog.create({
    data: {
      userId: req.auth!.userId,
      action: "VIEW_PATIENT_HISTORY",
      entityId: patientId,
    },
  });

  res.json({
    patient: {
      id: patient.id,
      patientCode: patient.patientCode,
      fullName: patient.fullName,
      dob: patient.dob,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
    },
    totalVisits: patient.visits.length,
    visits: patient.visits, // each includes doctor, prescription, reports
    reports: patient.reports,
  });
});

// -------------------------------------------------------------
// POST /api/doctor/appointments/:appointmentId/start-visit
// Doctor "patient se uski problem puche" -> opens/creates the visit.
// -------------------------------------------------------------
const startVisitSchema = z.object({ chiefComplaint: z.string().min(1) });

router.post("/appointments/:appointmentId/start-visit", async (req, res) => {
  const parsed = startVisitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const appt = await prisma.appointment.findUnique({ where: { id: req.params.appointmentId } });
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  const visit = await prisma.visit.create({
    data: {
      appointmentId: appt.id,
      patientId: appt.patientId,
      doctorId: req.auth!.doctorId!,
      chiefComplaint: parsed.data.chiefComplaint,
    },
  });

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: "IN_CONSULTATION", doctorId: req.auth!.doctorId! },
  });

  res.status(201).json(visit);
});

// -------------------------------------------------------------
// PATCH /api/doctor/visits/:visitId
// Doctor records diagnosis / vitals / notes.
// -------------------------------------------------------------
const updateVisitSchema = z.object({
  diagnosis: z.string().optional(),
  doctorNotes: z.string().optional(),
  vitalsBP: z.string().optional(),
  vitalsPulse: z.string().optional(),
  vitalsTemp: z.string().optional(),
  vitalsWeight: z.string().optional(),
});

router.patch("/visits/:visitId", async (req, res) => {
  const parsed = updateVisitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const visit = await prisma.visit.update({
    where: { id: req.params.visitId },
    data: parsed.data,
  });
  res.json(visit);
});

// -------------------------------------------------------------
// POST /api/doctor/visits/:visitId/prescribe
// "medicines select krke us hospital ke prescribed medical store pr send kr de"
// Body: { items: [{ medicineId, dosage, durationDays, instructions? }] }
// -------------------------------------------------------------
const prescribeSchema = z.object({
  items: z
    .array(
      z.object({
        medicineId: z.string(),
        dosage: z.string(),
        durationDays: z.number().int().positive(),
        instructions: z.string().optional(),
      })
    )
    .min(1),
});

router.post("/visits/:visitId/prescribe", async (req, res) => {
  const parsed = prescribeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const visit = await prisma.visit.findUnique({ where: { id: req.params.visitId } });
  if (!visit) return res.status(404).json({ error: "Visit not found" });

  // This creates the prescription with status SENT_TO_PHARMACY --
  // the pharmacy module (phase 2) will just query prescriptions with
  // this status, filtered by patientCode entered at the counter.
  const prescription = await prisma.prescription.create({
    data: {
      visitId: visit.id,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      status: "SENT_TO_PHARMACY",
      items: {
        create: parsed.data.items.map((i) => ({
          medicineId: i.medicineId,
          dosage: i.dosage,
          durationDays: i.durationDays,
          instructions: i.instructions,
        })),
      },
    },
    include: { items: { include: { medicine: true } } },
  });

  await prisma.appointment.update({
    where: { id: visit.appointmentId },
    data: { status: "COMPLETED" },
  });

  await prisma.auditLog.create({
    data: { userId: req.auth!.userId, action: "CREATE_PRESCRIPTION", entityId: prescription.id },
  });

  res.status(201).json(prescription);
});

// -------------------------------------------------------------
// GET /api/doctor/medicines/search?q=...  (for the prescribe dropdown)
// -------------------------------------------------------------
router.get("/medicines/search", async (req, res) => {
  const q = (req.query.q as string) || "";
  const medicines = await prisma.medicine.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    take: 15,
  });
  res.json(medicines);
});

export default router;
