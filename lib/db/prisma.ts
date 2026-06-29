import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Não configurada.");
}

const poolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
const { connectionString, ssl } = getDatabaseConnection(databaseUrl);

const adapterConfig: PoolConfig = {
  connectionString,
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

function getDatabaseConnection(connectionString: string): {
  connectionString: string;
  ssl: PoolConfig["ssl"] | undefined;
} {
  if (process.env.DATABASE_SSL === "false") {
    return { connectionString, ssl: false };
  }

  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode");

    if (sslMode === "disable") {
      return { connectionString, ssl: false };
    }

    if (sslMode) {
      url.searchParams.delete("sslmode");
      return {
        connectionString: url.toString(),
        ssl: { rejectUnauthorized },
      };
    }

    if (
      process.env.DATABASE_SSL === "true" ||
      url.hostname.endsWith(".rds.amazonaws.com")
    ) {
      return { connectionString, ssl: { rejectUnauthorized } };
    }
  } catch {
    if (process.env.DATABASE_SSL === "true") {
      return { connectionString, ssl: { rejectUnauthorized } };
    }
  }

  return { connectionString, ssl: undefined };
}
