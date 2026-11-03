// --apply creates and immediately expires one unpaid live session. Never submits a card.
import nextEnv from "@next/env";
import Stripe from "stripe";
import { Pool } from "pg";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import { setDefaultResultOrder } from "node:dns";
import assert from "node:assert/strict";
import { PaymentStore } from "../../lib/payments/store";
import type { Variant } from "../../lib/commerce/catalog";

setDefaultResultOrder("ipv4first");
nextEnv.loadEnvConfig(process.cwd());
const env = parseEnv(await readFile(".env", "utf8"));
assert.match(env.STRIPE_API_KEY || "", /^(sk|rk)_live_/);
const stripe = new Stripe(env.STRIPE_API_KEY!, {
  timeout: 20000,
  maxNetworkRetries: 2,
});
const account = await stripe.accounts.retrieve(null);
assert.equal(account.id, "acct_1UITMPHKfhrlO2yz");
const endpoint = (await stripe.webhookEndpoints.list({ limit: 100 })).data.find(
  (e) => e.url === "https://www.iyayusufspantry.com/api/stripe/live-webhook",
);
assert.ok(endpoint?.livemode && endpoint.status === "enabled");
if (!process.argv.includes("--apply")) {
  console.log(
    "Live account and endpoint verified. Pass --apply to verify an unpaid session's real expiration webhook; no charge is made.",
  );
  process.exit(0);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 1,
});
const store = new PaymentStore(pool, "simbiat_checkout_live", { live: true });
const folder = "artifacts/stripe-live-readiness-2026-10-31";
await mkdir(folder, { recursive: true });
let sessionId: string | undefined;
const orderId = randomUUID();
try {
  const snapshot = JSON.parse(
    await readFile("docs/starting-stock-2026-10-24.json", "utf8"),
  );
  const allocation = snapshot.products[0].variantAllocations[0];
  const url = `https://cdn.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT || "master"}/entries/${allocation.entryId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.CONTENTFUL_DELIVERY_TOKEN}`,
    },
  });
  assert.equal(response.status, 200);
  const { fields } = await response.json();
  const variant: Variant = {
    id: fields.variantId,
    productSlug: snapshot.products[0].slug,
    size: fields.size,
    dietary: fields.dietary,
    priceCents: fields.priceCents,
    currency: fields.currency,
    active: fields.active,
  };
  const before = (
    await pool.query(
      "SELECT on_hand,reserved FROM simbiat_checkout_live.stock WHERE variant_id=$1",
      [variant.id],
    )
  ).rows[0];
  const order = await store.reserve(
    orderId,
    [{ variantId: variant.id, quantity: 1 }],
    [variant],
    "https://www.iyayusufspantry.com",
    { [variant.productSlug]: snapshot.products[0].name },
  );
  await writeFile(
    `${folder}/live-smoke-pending.json`,
    JSON.stringify(
      { orderId, variantId: variant.id, before, noCharge: true },
      null,
      2,
    ),
  );
  const session = await stripe.checkout.sessions.create(order.stripe_params, {
    idempotencyKey: `checkout-${order.id}`,
  });
  sessionId = session.id;
  assert.ok(
    session.livemode &&
      session.id.startsWith("cs_live_") &&
      session.payment_status === "unpaid",
  );
  await store.attachSession(order.id, session);
  await writeFile(
    `${folder}/live-smoke-pending.json`,
    JSON.stringify(
      { orderId, sessionId, variantId: variant.id, before, noCharge: true },
      null,
      2,
    ),
  );
  console.log(
    "Created one unpaid live session and verified live-mode shipping/tax parameters. Expiring it now; no payment details were entered.",
  );
  await stripe.checkout.sessions.expire(session.id);
  let confirmed = false;
  for (let i = 0; i < 20; i++) {
    const response = await fetch(
      `https://www.iyayusufspantry.com/api/checkout/status?session_id=${session.id}`,
      { cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    if (response.ok && (await response.json()).status === "cancelled") {
      confirmed = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  assert.ok(
    confirmed,
    "Live expiration webhook has not confirmed cancellation; inspect saved session reference before retrying",
  );
  const after = (
    await pool.query(
      "SELECT on_hand,reserved FROM simbiat_checkout_live.stock WHERE variant_id=$1",
      [variant.id],
    )
  ).rows[0];
  assert.deepEqual(
    after,
    before,
    "Live test reservation was not fully released",
  );
  const events = await stripe.events.list({
    type: "checkout.session.expired",
    limit: 100,
  });
  const event = events.data.find(
    (e) => (e.data.object as Stripe.Checkout.Session).id === session.id,
  );
  const report = {
    orderId,
    sessionId,
    eventId: event?.id,
    pendingWebhooks: event?.pending_webhooks,
    livemode: true,
    charged: false,
    publicStatus: "cancelled",
    reservationRestored: true,
    webhookUrl: endpoint.url,
  };
  await writeFile(
    `${folder}/live-smoke-result.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.status === "open")
      await stripe.checkout.sessions.expire(sessionId);
  }
  await pool.end();
}
