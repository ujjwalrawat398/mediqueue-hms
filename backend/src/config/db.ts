import { PrismaClient } from "@prisma/client";

// Singleton so we don't exhaust DB connections in dev with hot-reload
export const prisma = new PrismaClient();
