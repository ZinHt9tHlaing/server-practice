import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { ENV } from "@/config/env";

const databaseUrl = ENV.DATABASE_URL;

const adapter = new PrismaPg({ connectionString: databaseUrl });

const globalPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalPrisma.prisma ||
  new PrismaClient({
    adapter,
    // log: ["error", "query"],
    log: ["error", "warn", "info"],
    errorFormat: "pretty",
  });

if (ENV.NODE_ENV !== "production") {
  globalPrisma.prisma = prisma;
}
