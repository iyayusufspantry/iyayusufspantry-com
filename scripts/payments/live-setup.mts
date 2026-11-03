// Preview by default. --apply prepares live inventory and the snapshot webhook.
// It never enables customer purchases or makes a charge.
import nextEnv from "@next/env";
import Stripe from "stripe";
import { Pool } from "pg";
import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import { parseEnv } from "node:util";
import assert from "node:assert/strict";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");
nextEnv.loadEnvConfig(process.cwd());
const env = parseEnv(await readFile(".env", "utf8"));
const key = env.STRIPE_API_KEY?.trim();
assert.match(key || "", /^(sk|rk)_live_/, "STRIPE_API_KEY must be live");
const stripe = new Stripe(key!, { timeout: 20000, maxNetworkRetries: 2 });
const account = await stripe.accounts.retrieve(null);
assert.equal(account.id, "acct_1UITMPHKfhrlO2yz", "Unexpected live account");
assert.ok(account.charges_enabled && account.payouts_enabled);
assert.equal(account.capabilities?.card_payments, "active");
const snapshot = JSON.parse(
  await readFile("docs/starting-stock-2026-10-24.json", "utf8"),
);
const allocations: {
  entryId: string;
  variantId: string;
  startingQuantity: number;
}[] = snapshot.products.flatMap(
  (p: { variantAllocations: unknown[] }) => p.variantAllocations,
);
assert.equal(
  new Set(allocations.map((a) => a.variantId)).size,
  allocations.length,
);
assert.equal(allocations.length, 24);
assert.equal(
  allocations.reduce((n, a) => n + a.startingQuantity, 0),
  1020,
);
for (const a of allocations)
  assert.ok(Number.isSafeInteger(a.startingQuantity) && a.startingQuantity > 0);
const url = new URL(
  `https://cdn.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT || "master"}/entries`,
);
url.search = new URLSearchParams({
  content_type: "pantryVariant",
  limit: "1000",
  include: "0",
}).toString();
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${process.env.CONTENTFUL_DELIVERY_TOKEN}` },
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.status, 200);
const published = await response.json();
assert.equal(published.total, published.items.length);
for (const allocation of allocations) {
  const variant = published.items.find(
    (v: { sys: { id: string } }) => v.sys.id === allocation.entryId,
  );
  assert.ok(
    variant &&
      variant.fields.variantId === allocation.variantId &&
      variant.fields.active === true,
    `Invalid published variant: ${allocation.variantId}`,
  );
  assert.ok(
    Number.isSafeInteger(variant.fields.priceCents) &&
      variant.fields.priceCents >= 50 &&
      variant.fields.currency === "USD",
  );
}
const endpointUrl = "https://www.iyayusufspantry.com/api/stripe/live-webhook";
const events: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "checkout.session.expired",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
];
const endpoints = await stripe.webhookEndpoints
  .list({ limit: 100 })
  .autoPagingToArray({ limit: 1000 });
let endpoint = endpoints.find((e) => e.url === endpointUrl);
if (endpoint) {
  assert.equal(endpoint.status, "enabled");
  assert.ok(events.every((event) => endpoint!.enabled_events.includes(event)));
}
console.log(
  JSON.stringify({
    mode: process.argv.includes("--apply") ? "apply" : "preview",
    accountId: account.id,
    liveVariants: allocations.length,
    startingUnits: 1020,
    endpointExists: !!endpoint,
    customerPurchasesEnabled: false,
  }),
);
if (!process.argv.includes("--apply")) process.exit(0);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 1,
});
try {
  const sql = (await readFile("lib/payments/schema.sql", "utf8")).replaceAll(
    "simbiat_checkout_test",
    "simbiat_checkout_live",
  );
  await pool.query(sql);
  await pool.query("BEGIN");
  try {
    for (const a of allocations)
      await pool.query(
        "INSERT INTO simbiat_checkout_live.stock(variant_id,on_hand) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [a.variantId, a.startingQuantity],
      );
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
  if (!endpoint) {
    endpoint = await stripe.webhookEndpoints.create(
      {
        url: endpointUrl,
        api_version: "2026-08-26.dahlia",
        enabled_events: events,
        description: "Pantry live checkout order confirmation",
        metadata: { integration: "simbiat-live-v1" },
      },
      { idempotencyKey: "pantry-live-checkout-webhook-v1" },
    );
    assert.ok(endpoint.secret);
    // Persist the signing secret immediately, without displaying it.
    await appendFile(
      ".env.local",
      `\nSTRIPE_LIVE_WEBHOOK_SECRET=${endpoint.secret}\n`,
    );
    process.env.STRIPE_LIVE_WEBHOOK_SECRET = endpoint.secret;
  } else {
    assert.ok(
      process.env.STRIPE_LIVE_WEBHOOK_SECRET,
      "Existing endpoint requires its saved signing secret; do not rotate blindly",
    );
  }
  await mkdir("artifacts/stripe-live-readiness-2026-10-31", {
    recursive: true,
  });
  const stock = await pool.query(
    "SELECT count(*)::int AS variants,sum(on_hand)::int AS units,sum(reserved)::int AS reserved FROM simbiat_checkout_live.stock",
  );
  await writeFile(
    "artifacts/stripe-live-readiness-2026-10-31/live-setup.json",
    JSON.stringify(
      {
        accountId: account.id,
        webhookId: endpoint.id,
        webhookUrl: endpoint.url,
        live: endpoint.livemode,
        stock: stock.rows[0],
        source: "docs/starting-stock-2026-10-24.json",
        customerPurchasesEnabled: false,
      },
      null,
      2,
    ),
  );
  console.log(
    "Live schema, approved starting stock and webhook are prepared. Existing stock was preserved. Signing secret saved privately. Customer purchases remain gated.",
  );
} finally {
  await pool.end();
}
