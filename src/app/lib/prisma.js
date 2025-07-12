// lib/prisma.js
import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, prevent multiple instances with hot reload
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = globalThis.prisma;
}

export { prisma };
