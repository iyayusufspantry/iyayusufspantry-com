import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import Stripe from "stripe";
import { paymentConfig } from "../../lib/payments/config";

nextEnv.loadEnvConfig(process.cwd());
const config = paymentConfig();
const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 10000,
});
try {
  const stripe = new Stripe(config.key);
  const balance = await stripe.balance.retrieve();
  if (balance.livemode) throw new Error("A test account is required");
  await pool.query(
    await readFile(
      new URL("../../lib/payments/schema.sql", import.meta.url),
      "utf8",
    ),
  );
  console.log(
    "Stripe test credentials verified. Sandbox database schema is ready. Existing tables and stock were preserved.",
  );
} catch {
  console.error(
    "Payment setup failed. Check test-key permissions, database connectivity, and schema-creation permission. No credentials were printed.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
