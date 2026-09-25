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
type Scope = "local" | "website";
const checks: {
  scope: Scope;
  name: string;
  passed: boolean;
  detail: string;
}[] = [];
const check = (scope: Scope, name: string, passed: boolean, detail: string) =>
  checks.push({ scope, name, passed, detail });
const present = (key: string) => !!process.env[key]?.trim();

check(
  "local",
  "Owner allowlist",
  ["OWNER_CLERK_USER_IDS", "OWNER_EMAILS"].some((key) =>
    process.env[key]?.split(",").some((value) => value.trim()),
  ),
  "Configure owner IDs OR verified owner emails; both are not required.",
);
for (const key of [
  "DATABASE_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "FORM_SECRET",
  "CRON_SECRET",
]) {
  check(
    "local",
    key,
    present(key),
    "Presence only; values hidden, provider validity not established.",
  );
}
for (const key of [
  "STRIPE_CHECKOUT_ENABLED",
  "CONTACT_ENABLED",
  "NEWSLETTER_ENABLED",
  "EMAIL_DELIVERY_ENABLED",
]) {
  check(
    "local",
    key,
    process.env[key] === "true",
    "Must be true to enable this feature locally; does not inspect Vercel configuration.",
  );
}
check(
  "local",
  "Stripe test key",
  /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || ""),
  "This implementation supports sandbox payments only.",
);

// A database outage must not hide public endpoint results.
if (present("DATABASE_URL")) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    max: 1,
  });
  try {
    const tables = [
      "simbiat_operations.contact_messages",
      "simbiat_operations.subscribers",
      "simbiat_operations.mail",
      "simbiat_operations.rate_limits",
      "simbiat_checkout_test.orders",
      "simbiat_checkout_test.stock",
      "simbiat_checkout_test.events",
      "simbiat_checkout_test.owner_audit",
    ];
    const result = await pool.query<{ name: string; exists: boolean }>(
      "SELECT name, to_regclass(name) IS NOT NULL AS exists FROM unnest($1::text[]) AS names(name)",
      [tables],
    );
    const missing = result.rows
      .filter((row) => !row.exists)
      .map((row) => row.name);
    check(
      "local",
      "Database tables",
      !missing.length,
      missing.length
        ? "Missing: " +
            missing.join(", ") +
            ". Run payments:setup and operations:setup."
        : "All eight tables exist in the locally configured database; remote database configuration is not inspected.",
    );
  } catch {
    check(
      "local",
      "Database tables",
      false,
      "Database check failed; credentials and provider errors hidden.",
    );
  } finally {
    await pool.end();
  }
}

async function probe(
  name: string,
  path: string,
  expected: number,
  detail: string,
  init?: RequestInit,
) {
  try {
    const response = await fetch(origin + path, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    check(
      "website",
      name,
      response.status === expected,
      "HTTP " + response.status + "; " + detail,
    );
    await response.body?.cancel();
  } catch {
    check(
      "website",
      name,
      false,
      "Website unreachable or request timed out; other checks continue.",
    );
  }
}
const invalidForm: RequestInit = {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: "{}",
};
await Promise.all([
  probe(
    "Checkout validation reachable",
    "/api/checkout/session",
    400,
    "invalid cart must return 400. This does not prove Stripe, database writes, or rate limiting work.",
    invalidForm,
  ),
  probe(
    "Contact validation reachable",
    "/api/contact",
    400,
    "invalid message must return 400; no message or email is created.",
    invalidForm,
  ),
  probe(
    "Newsletter validation reachable",
    "/api/newsletter",
    400,
    "missing consent must return 400; no subscription or email is created.",
    invalidForm,
  ),
  probe(
    "Owner API protected",
    "/api/owner",
    401,
    "anonymous access must be denied; owner sign-in still needs acceptance testing.",
  ),
  probe(
    "Subscriber export protected",
    "/api/owner/subscribers",
    401,
    "anonymous access must be denied.",
  ),
  probe(
    "Maintenance protected",
    "/api/cron/maintenance",
    401,
    "anonymous access must be denied; this does not establish a configured scheduler.",
  ),
]);
const secret = production
  ? base?.STRIPE_WEBHOOK_SECRET
  : process.env.STRIPE_WEBHOOK_SECRET;
if (secret && /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || "")) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const payload = JSON.stringify({
    id: "evt_check_" + randomUUID(),
    object: "event",
    type: "checkout.session.completed",
    livemode: false,
    data: { object: { metadata: {} } },
  });
  await probe(
    "Stripe signing secret match",
    "/api/stripe/webhook",
    200,
    "harmless unrelated event; no order mutation. Real Stripe delivery still needs a test purchase.",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": stripe.webhooks.generateTestHeaderString({
          payload,
          secret,
        }),
      },
      body: payload,
    },
  );
} else {
  check(
    "website",
    "Stripe signing secret match",
    false,
    "Test key or signing secret is missing; public checks use the Dashboard secret from .env, never the CLI override.",
  );
}
console.log(
  JSON.stringify(
    {
      target: origin,
      livePaymentsSupported: false,
      limitations: [
        "Local settings are not proof of Vercel settings. No remote environment variables are read.",
        "Readiness probes do not replace a hosted test purchase, owner sign-in, email delivery, or scheduled maintenance verification.",
      ],
      checks: checks.sort(
        (a, b) =>
          a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name),
      ),
    },
    null,
    2,
  ),
);
if (checks.some((entry) => !entry.passed)) process.exitCode = 1;
