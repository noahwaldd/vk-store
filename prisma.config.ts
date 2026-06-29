import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const databaseUrl = withRequiredPostgresSsl(env("DATABASE_URL"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});

function withRequiredPostgresSsl(connectionString: string) {
  if (process.env.DATABASE_SSL === "false") {
    return connectionString;
  }

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode");
    const requiresSsl =
      process.env.DATABASE_SSL === "true" ||
      url.hostname.endsWith(".rds.amazonaws.com") ||
      Boolean(sslMode && sslMode !== "disable");

    if (
      requiresSsl &&
      !url.searchParams.has("sslmode")
    ) {
      url.searchParams.set("sslmode", "require");
    }

    if (
      requiresSsl &&
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "true" &&
      !url.searchParams.has("sslaccept")
    ) {
      url.searchParams.set("sslaccept", "accept_invalid_certs");
    }

    return url.toString();
  } catch {
    return connectionString;
  }
}
