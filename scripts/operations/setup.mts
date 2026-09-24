import nextEnv from "@next/env";
import { readFile, appendFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
try {
  await pool.query(
    await readFile(
      new URL("../../lib/operations/schema.sql", import.meta.url),
      "utf8",
    ),
  );
  for (const name of ["FORM_SECRET", "CRON_SECRET"]) {
    if (!process.env[name])
      await appendFile(
        ".env.local",
        `\n${name}=${randomBytes(32).toString("hex")}\n`,
      );
  }
  console.log(
    "Contact, newsletter, email queue, and rate-limit tables are ready. Local form/maintenance secrets are configured (values hidden). Existing data was preserved.",
  );
} catch {
  console.error(
    "Operations setup failed. Check database access. Credentials are hidden.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
