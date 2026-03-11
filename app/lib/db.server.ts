process.loadEnvFile?.(".env")

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../generated/prisma/client"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to initialize Prisma")
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const db = 
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
