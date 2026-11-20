import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Departments
  const departments = ["General Medicine", "Cardiology", "ENT", "Orthopedics", "Pediatrics"];
  for (const name of departments) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Sample doctor login: doctor@hospital.com / doctor123
  const generalMed = await prisma.department.findUniqueOrThrow({ where: { name: "General Medicine" } });
  const existingDoc = await prisma.user.findUnique({ where: { email: "doctor@hospital.com" } });
  if (!existingDoc) {
    const passwordHash = await bcrypt.hash("doctor123", 10);
    await prisma.user.create({
      data: {
        phone: "9999900001",
        email: "doctor@hospital.com",
        passwordHash,
        role: "DOCTOR",
        doctor: {
          create: {
            fullName: "Dr. Ananya Sharma",
            qualification: "MBBS, MD",
            registrationNo: "MCI-12345",
            departmentId: generalMed.id,
          },
        },
      },
    });
  }

  // Common medicines
  const medicines = [
    { name: "Paracetamol", strength: "500mg", form: "Tablet" },
    { name: "Azithromycin", strength: "500mg", form: "Tablet" },
    { name: "Amoxicillin", strength: "250mg", form: "Capsule" },
    { name: "Cetirizine", strength: "10mg", form: "Tablet" },
    { name: "Pantoprazole", strength: "40mg", form: "Tablet" },
    { name: "ORS", strength: null, form: "Sachet" },
  ];
  for (const m of medicines) {
    await prisma.medicine.upsert({ where: { name: m.name }, update: {}, create: m });
  }

  console.log("Seed complete. Doctor login -> doctor@hospital.com / doctor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
