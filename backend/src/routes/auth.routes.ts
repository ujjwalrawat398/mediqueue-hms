import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/db";

const router = Router();

// -------------------------------------------------------------
// Helper: generate the next human-readable Patient ID
// e.g. HOSP-2026-000123  (shown at pharmacy counter)
// -------------------------------------------------------------
async function nextPatientCode(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.patient.count();
  const seq = String(count + 1).padStart(6, "0");
  return `HOSP-${year}-${seq}`;
}

function signToken(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

// -------------------------------------------------------------
// POST /api/auth/patient/register
// This is what runs the first time someone scans the QR and
// doesn't have an account yet.
// NOTE: For production, replace password step with OTP-over-SMS.
// -------------------------------------------------------------
const registerSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
  fullName: z.string().min(2),
  dob: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});

router.post("/patient/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { phone, password, fullName, dob, gender } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return res.status(409).json({ error: "Phone already registered. Please log in." });

  const passwordHash = await bcrypt.hash(password, 10);
  const patientCode = await nextPatientCode();

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash,
      role: "PATIENT",
      patient: {
        create: {
          patientCode,
          fullName,
          dob: dob ? new Date(dob) : undefined,
          gender,
        },
      },
    },
    include: { patient: true },
  });

  const token = signToken({ userId: user.id, role: "PATIENT", patientId: user.patient!.id });
  res.status(201).json({
    token,
    patient: { id: user.patient!.id, patientCode, fullName },
  });
});

// -------------------------------------------------------------
// POST /api/auth/patient/login
// -------------------------------------------------------------
const loginSchema = z.object({ phone: z.string(), password: z.string() });

router.post("/patient/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({
    where: { phone: parsed.data.phone },
    include: { patient: true },
  });
  if (!user || user.role !== "PATIENT" || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid phone or password" });
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid phone or password" });

  const token = signToken({ userId: user.id, role: "PATIENT", patientId: user.patient!.id });
  res.json({ token, patient: user.patient });
});

// -------------------------------------------------------------
// POST /api/auth/staff/login  (doctor / admin / receptionist / pharmacist)
// Staff accounts are created by an Admin (see admin routes), not self-registered.
// -------------------------------------------------------------
const staffLoginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post("/staff/login", async (req, res) => {
  const parsed = staffLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { doctor: true },
  });
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken({
    userId: user.id,
    role: user.role,
    doctorId: user.doctor?.id,
  });
  res.json({ token, role: user.role, doctor: user.doctor });
});

export default router;
