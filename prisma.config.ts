import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const databaseUrl = withRequiredAwsRdsSsl(env("DATABASE_URL"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});

function withRequiredAwsRdsSsl(connectionString: string) {
  if (process.env.DATABASE_SSL === "false") {
    return connectionString;
  }

  try {
    const url = new URL(connectionString);

    if (
      url.hostname.endsWith(".rds.amazonaws.com") &&
      !url.searchParams.has("sslmode")
    ) {
      url.searchParams.set("sslmode", "require");
    }

    return url.toString();
  } catch {
    return connectionString;
  }
}
