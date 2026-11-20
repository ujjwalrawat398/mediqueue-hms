import { Router } from "express";
import { prisma } from "../config/db";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireRole("PATIENT"));

// GET /api/patient/me - profile
router.get("/me", async (req, res) => {
  const patient = await prisma.patient.findUnique({ where: { id: req.auth!.patientId! } });
  res.json(patient);
});

// GET /api/patient/appointments - upcoming + past appointments/tokens
router.get("/appointments", async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { patientId: req.auth!.patientId! },
    include: { department: true, doctor: { select: { fullName: true } } },
    orderBy: { scheduledDate: "desc" },
  });
  res.json(appointments);
});

// GET /api/patient/history - own visits, diagnoses, prescriptions
router.get("/history", async (req, res) => {
  const visits = await prisma.visit.findMany({
    where: { patientId: req.auth!.patientId! },
    orderBy: { visitDate: "desc" },
    include: {
      doctor: { select: { fullName: true, department: { select: { name: true } } } },
      prescription: { include: { items: { include: { medicine: true } } } },
    },
  });
  res.json(visits);
});

// GET /api/patient/reports - lab reports / scans
router.get("/reports", async (req, res) => {
  const reports = await prisma.report.findMany({
    where: { patientId: req.auth!.patientId! },
    orderBy: { uploadedAt: "desc" },
  });
  res.json(reports);
});

// GET /api/patient/prescriptions - active/past prescriptions (so patient can
// see what to expect at the pharmacy counter)
router.get("/prescriptions", async (req, res) => {
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: req.auth!.patientId! },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { medicine: true } },
      doctor: { select: { fullName: true } },
    },
  });
  res.json(prescriptions);
});

export default router;
