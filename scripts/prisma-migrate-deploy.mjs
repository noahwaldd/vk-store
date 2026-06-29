import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env", quiet: true });

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

const migrationChecks = {
  "20260513010000_init_rds_postgres": async (client) =>
    hasTables(client, [
      "categories",
      "products",
      "product_images",
      "navigation_items",
      "customers",
      "orders",
      "order_items",
    ]),
  "20260514010000_add_database_users": async (client) =>
    hasTables(client, ["users"]),
  "20260514020000_account_profile_and_site_settings": async (client) =>
    hasTables(client, ["site_settings"]) &&
    hasColumns(client, "users", ["first_name", "last_name", "phone"]),
  "20260515010000_add_category_images": async (client) =>
    hasColumns(client, "categories", ["image_url", "image_key"]),
  "20260516010000_drop_mercado_pago_column": async (client) =>
    hasTables(client, ["orders"]) &&
    !(await hasColumns(client, "orders", ["mercado_pago_preference_id"])),
  "20260516020000_add_category_position_and_fix_labels": async (client) =>
    hasColumns(client, "categories", ["position"]),
  "20260516020000_add_onboarding_rate_limits": async (client) =>
    hasTables(client, ["onboarding_rate_limits"]),
  "20260519010000_add_password_reset_tokens": async (client) =>
    hasTables(client, ["password_reset_tokens"]) &&
    !(await hasColumns(client, "orders", ["payment_provider", "payment_preference_id"])),
  "20260520010000_add_user_checkout_profile": async (client) =>
    hasColumns(client, "users", [
      "checkout_name",
      "checkout_email",
      "checkout_phone",
      "checkout_cep",
      "checkout_address",
      "checkout_number",
      "checkout_city",
      "checkout_state",
      "legal_accepted_at",
    ]),
  "20260520020000_add_coupon_usage_to_orders": async (client) =>
    hasColumns(client, "orders", ["coupon_code", "coupon_discount"]),
  "20260523010000_add_product_offer_flag": async (client) =>
    hasColumns(client, "products", ["is_offer"]),
};

const firstDeploy = await runPrisma(["migrate", "deploy"], {
  allowFailure: true,
});

if (firstDeploy.exitCode === 0) {
  process.exit(0);
}

if (!firstDeploy.output.includes("P3005")) {
  process.stdout.write(firstDeploy.output);
  process.exit(firstDeploy.exitCode);
}

console.log("Prisma detected a non-empty database without migration history. Baselining reflected migrations...");

await baselineExistingSchema();

const secondDeploy = await runPrisma(["migrate", "deploy"], {
  allowFailure: true,
});

process.stdout.write(secondDeploy.output);
process.exit(secondDeploy.exitCode);

async function baselineExistingSchema() {
  const client = new pg.Client({
    connectionString: getDatabaseUrl(),
    ssl: getSslConfig(),
  });

  await client.connect();

  try {
    const migrations = (await readdir(migrationsDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const migration of migrations) {
      const check = migrationChecks[migration];

      if (!check) {
        throw new Error(`No baseline check configured for migration ${migration}`);
      }

      if (await check(client)) {
        console.log(`Marking reflected migration as applied: ${migration}`);
        const result = await runPrisma(["migrate", "resolve", "--applied", migration], {
          allowFailure: true,
        });

        if (result.exitCode !== 0 && !/already.*applied/i.test(result.output)) {
          process.stdout.write(result.output);
          process.exit(result.exitCode);
        }

        continue;
      }

      console.log(`Stopping baseline before missing migration: ${migration}`);
      break;
    }
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function hasTables(client, tableNames) {
  const result = await client.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
    `,
    [tableNames],
  );

  return result.rowCount === tableNames.length;
}

async function hasColumns(client, tableName, columnNames) {
  const result = await client.query(
    `
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
        and column_name = any($2::text[])
    `,
    [tableName, columnNames],
  );

  return result.rowCount === columnNames.length;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined");
  }

  const parsed = new URL(databaseUrl);
  parsed.searchParams.delete("schema");

  if (
    parsed.searchParams.get("sslmode") === "require" &&
    !parsed.searchParams.has("uselibpqcompat")
  ) {
    parsed.searchParams.set("uselibpqcompat", "true");
  }

  return parsed.toString();
}

function getSslConfig() {
  if (process.env.DATABASE_SSL === "false") {
    return false;
  }

  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true") {
    return { rejectUnauthorized: true };
  }

  return { rejectUnauthorized: false };
}

function runPrisma(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [getPrismaCliPath(), ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      if (exitCode === 0 || options.allowFailure) {
        resolve({ exitCode: exitCode ?? 1, output });
        return;
      }

      reject(new Error(`prisma ${args.join(" ")} exited with code ${exitCode}`));
    });
  });
}

function getPrismaCliPath() {
  return path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
}
