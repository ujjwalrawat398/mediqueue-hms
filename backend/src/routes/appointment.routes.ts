import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// -------------------------------------------------------------
// GET /api/appointments/departments
// Patient sees this list right after scanning the QR, to pick
// "kis cheez ke regarding" (which department) they want.
// -------------------------------------------------------------
router.get("/departments", async (_req, res) => {
  const departments = await prisma.department.findMany({
    include: { doctors: { select: { id: true, fullName: true, qualification: true } } },
  });
  res.json(departments);
});

// -------------------------------------------------------------
// POST /api/appointments/book
// This is the actual "QR click -> number lagana" step.
// Body: { departmentId, doctorId?, reasonNote? }
// -------------------------------------------------------------
const bookSchema = z.object({
  departmentId: z.string(),
  doctorId: z.string().optional(),
  reasonNote: z.string().optional(),
});

router.post("/book", requireAuth, requireRole("PATIENT"), async (req, res) => {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { departmentId, doctorId, reasonNote } = parsed.data;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Token number = count of today's appointments in this department + 1
  const todaysCount = await prisma.appointment.count({
    where: { departmentId, scheduledDate: { gte: startOfDay } },
  });

  const appointment = await prisma.appointment.create({
    data: {
      tokenNumber: todaysCount + 1,
      patientId: req.auth!.patientId!,
      departmentId,
      doctorId,
      reasonNote,
      status: "BOOKED",
    },
    include: { department: true, doctor: true },
  });

  res.status(201).json(appointment);
});

// -------------------------------------------------------------
// GET /api/appointments/queue?departmentId=...
// Doctor/reception view of today's queue by token number.
// -------------------------------------------------------------
router.get("/queue", requireAuth, requireRole("DOCTOR", "ADMIN", "RECEPTIONIST"), async (req, res) => {
  const { departmentId } = req.query;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const queue = await prisma.appointment.findMany({
    where: {
      departmentId: departmentId as string | undefined,
      scheduledDate: { gte: startOfDay },
      status: { in: ["BOOKED", "CHECKED_IN"] },
    },
    include: { patient: true },
    orderBy: { tokenNumber: "asc" },
  });

  res.json(queue);
});

export default router;
