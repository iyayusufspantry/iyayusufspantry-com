import nextEnv from "@next/env";
import { Pool } from "pg";
import { OperationsStore } from "../../lib/operations/store";
import { drainMail, sendWithResend } from "../../lib/operations/mail";
nextEnv.loadEnvConfig(process.cwd());
if (
  process.env.EMAIL_DELIVERY_ENABLED !== "true" ||
  !process.env.RESEND_API_KEY
) {
  console.log(
    "Email delivery is disabled. Configure the provider and EMAIL_DELIVERY_ENABLED first.",
  );
  process.exit(0);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
try {
  const result = await drainMail(new OperationsStore(pool), sendWithResend, 20);
  console.log(JSON.stringify(result));
  if (result.failed) process.exitCode = 1;
} catch {
  console.error("Email delivery incomplete. Messages remain queued for retry.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
