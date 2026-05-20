import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não configurada.");
}

const poolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
const ssl = getDatabaseSsl(databaseUrl);

const adapterConfig: PoolConfig = {
  connectionString: databaseUrl,
  max: Number.isFinite(poolMax) && poolMax > 0
    ? poolMax
    : process.env.NODE_ENV === "production"
      ? 5
      : 10,
  ...(ssl === undefined ? {} : { ssl }),
};

const adapter = new PrismaPg(adapterConfig);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function getDatabaseSsl(connectionString: string): PoolConfig["ssl"] | undefined {
  if (process.env.DATABASE_SSL === "false") {
    return false;
  }

  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode");

    if (sslMode && sslMode !== "disable") {
      return undefined;
    }

    if (
      process.env.DATABASE_SSL === "true" ||
      url.hostname.endsWith(".rds.amazonaws.com")
    ) {
      return { rejectUnauthorized };
    }
  } catch {
    if (process.env.DATABASE_SSL === "true") {
      return { rejectUnauthorized };
    }
  }

  return undefined;
}
