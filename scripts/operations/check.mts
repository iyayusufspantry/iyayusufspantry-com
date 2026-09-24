import nextEnv from "@next/env";
import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const env = nextEnv.loadEnvConfig(process.cwd());
const production = process.argv.includes("--public");
const origin = production
  ? "https://www.iyayusufspantry.com"
  : new URL(process.env.APP_URL || "http://localhost:3000").origin;
const base = env.loadedEnvFiles.find((file) => file.path === ".env")?.env;
const checks: { name: string; passed: boolean; detail: string }[] = [];
const check = (name: string, passed: boolean, detail: string) =>
  checks.push({ name, passed, detail });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
try {
  const tables = await pool.query(
    "SELECT to_regclass('simbiat_operations.contact_messages') AS inbox,to_regclass('simbiat_operations.mail') AS mail,to_regclass('simbiat_checkout_test.orders') AS orders",
  );
  check(
    "Database tables",
    Object.values(tables.rows[0]).every(Boolean),
    "Checks the locally configured database.",
  );
  for (const key of [
    "OWNER_CLERK_USER_IDS",
    "OWNER_EMAILS",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "FORM_SECRET",
    "CRON_SECRET",
  ]) {
    check(
      `Local ${key}`,
      !!process.env[key],
      key.startsWith("OWNER_")
        ? "Configure either owner IDs or verified owner emails."
        : "Value hidden.",
    );
  }
  const request = (path: string, init?: RequestInit) =>
    fetch(`${origin}${path}`, { ...init, signal: AbortSignal.timeout(20000) });
  const checkout = await request("/api/checkout/session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: "{}",
  });
  check(
    "Checkout enabled",
    checkout.status === 400,
    `HTTP ${checkout.status}; enabled checkout rejects this intentionally invalid cart with 400.`,
  );
  const owner = await request("/api/owner");
  check(
    "Owner access protected",
    owner.status === 401,
    `Unauthenticated HTTP ${owner.status}.`,
  );
  const secret = production
    ? base?.STRIPE_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET;
  if (secret && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const payload = JSON.stringify({
      id: `evt_check_${randomUUID()}`,
      object: "event",
      type: "checkout.session.completed",
      livemode: false,
      data: { object: { metadata: {} } },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const response = await request("/api/stripe/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    });
    check(
      "Stripe signing secret",
      response.status === 200,
      `HTTP ${response.status}; harmless unrelated event, no order mutation.`,
    );
  } else
    check(
      "Stripe signing secret",
      false,
      "Matching test key/signing secret is missing.",
    );
} catch {
  check(
    "Connectivity",
    false,
    "A provider or website check failed; no credentials printed.",
  );
} finally {
  await pool.end();
}
console.log(JSON.stringify({ target: origin, checks }, null, 2));
if (
  checks.some((c) => !c.passed && !c.name.startsWith("Local OWNER_")) ||
  !(process.env.OWNER_CLERK_USER_IDS || process.env.OWNER_EMAILS)
)
  process.exitCode = 1;
