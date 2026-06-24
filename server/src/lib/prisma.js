const { PrismaClient } = require("@prisma/client");

// Singleton pattern — reuse the same PrismaClient across hot-reloads in dev
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
