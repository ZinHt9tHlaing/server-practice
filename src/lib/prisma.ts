import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString: databaseUrl });

const globalPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["error", "query"],
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") globalPrisma.prisma = prisma;
