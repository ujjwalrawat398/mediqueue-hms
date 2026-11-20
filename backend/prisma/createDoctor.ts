/**
 * Utility script for hospital admin to add a new doctor login.
 * Run with: npx tsx prisma/createDoctor.ts
 * (Edit the values below, or turn this into an Admin API route later.)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "newdoctor@hospital.com";
  const phone = "9999900002";
  const password = "changeme123";
  const fullName = "Dr. Rajesh Kumar";
  const departmentName = "Cardiology";

  const department = await prisma.department.findUniqueOrThrow({ where: { name: departmentName } });
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash,
      role: "DOCTOR",
      doctor: {
        create: {
          fullName,
          departmentId: department.id,
        },
      },
    },
  });

  console.log(`Doctor created: ${email} / ${password}`);
}

main().finally(() => prisma.$disconnect());
