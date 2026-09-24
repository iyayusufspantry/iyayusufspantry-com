import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import Stripe from "stripe";
import { PaymentStore } from "../lib/payments/store";
import { reconcilePayments } from "../lib/payments/reconcile";
import { receiveWebhook } from "../lib/payments/http";
import { paymentConfig } from "../lib/payments/config";
import type { Variant } from "../lib/commerce/catalog";

loadEnvConfig(process.cwd());
const schema = `payment_test_${randomUUID().replaceAll("-", "")}`;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 4,
});
const store = new PaymentStore(pool, schema);
const stripe = new Stripe("sk_test_unit_test_only");
const secret = "whsec_unit_test_only";
const variant: Variant = {
  id: "classic-chin-chin:Small:Vegan",
  productSlug: "classic-chin-chin",
  priceCents: 800,
  size: "Small",
  dietary: "Vegan",
  active: true,
  currency: "USD",
};
function catalog() {
  return [{ ...variant, id: randomUUID() }];
}
async function reserve(quantity = 2, variants = catalog(), id = randomUUID()) {
  return store.reserve(
    id,
    [{ variantId: variants[0].id, quantity }],
    variants,
    "http://localhost:3000",
    {},
  );
}
function event(
  order: Awaited<ReturnType<typeof reserve>>,
  type = "checkout.session.completed",
  overrides: Record<string, unknown> = {},
): Stripe.Event {
  return {
    id: `evt_${randomUUID()}`,
    type,
    livemode: false,
    data: {
      object: {
        id: `cs_test_${order.id.replaceAll("-", "")}`,
        object: "checkout.session",
        livemode: false,
        mode: "payment",
        status: "complete",
        metadata: { order_id: order.id, integration: "simbiat-sandbox-v1" },
        client_reference_id: order.id,
        payment_status: "paid",
        payment_intent: `pi_${order.id}`,
        currency: "usd",
        amount_subtotal: order.quote.subtotalCents,
        amount_total: order.quote.subtotalCents,
        total_details: {
          amount_tax: 0,
          amount_shipping: 0,
          amount_discount: 0,
        },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}
function signedRequest(payload: string, timestamp?: number) {
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
    timestamp,
  });
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body: payload,
    headers: { "stripe-signature": signature },
  });
}
before(async () => {
  assert.ok(
    process.env.DATABASE_URL,
    "DATABASE_URL is required for transaction tests",
  );
  const sql = await readFile("lib/payments/schema.sql", "utf8");
  await pool.query(sql.replaceAll("simbiat_checkout_test", schema));
});

test("reconciliation rotates unresolved orders and recovers an expired reservation", async () => {
  await pool.query(`UPDATE ${schema}.orders SET last_reconciled_at=now()`);
  const old = await reserve();
  await pool.query(
    `UPDATE ${schema}.orders SET created_at=now()-interval '25 hours' WHERE id=$1`,
    [old.id],
  );
  const current = await reserve();
  const expired = event(current, "checkout.session.expired", {
    status: "expired",
    payment_status: "unpaid",
  }).data.object as Stripe.Checkout.Session;
  const client = {
    checkout: { sessions: { create: async () => expired } },
  } as unknown as Stripe;
  const first = await reconcilePayments(client, store, undefined, 1);
  assert.equal(first.manualReviewRequired, 1);
  let notifications = 0;
  const second = await reconcilePayments(
    client,
    store,
    async () => {
      notifications++;
    },
    1,
  );
  assert.equal(second.updated, 1);
  assert.equal(notifications, 1);
  assert.equal((await store.findSession(expired.id)).status, "cancelled");
  assert.equal(
    (
      await pool.query(
        `SELECT reserved FROM ${schema}.stock WHERE variant_id=$1`,
        [current.quote.lines[0].variantId],
      )
    ).rows[0].reserved,
    0,
  );
});
after(async () => {
  // Only this run's randomly named test schema is removed.
  assert.match(schema, /^payment_test_[a-f0-9]{32}$/);
  await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await pool.end();
});

test("live keys cannot activate sandbox checkout", () => {
  const previous = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_live_invalid";
  try {
    assert.throws(paymentConfig, /Live keys/);
  } finally {
    process.env.STRIPE_SECRET_KEY = previous;
  }
});
test("webhook rejects missing, tampered, stale and oversized signatures before processing", async () => {
  let calls = 0;
  const processEvent = async () => {
    calls++;
    return "processed";
  };
  const raw = JSON.stringify({ id: "evt_test", livemode: false });
  assert.equal(
    (
      await receiveWebhook(
        new Request("http://localhost", { method: "POST", body: raw }),
        stripe,
        secret,
        processEvent,
      )
    ).status,
    400,
  );
  const valid = signedRequest(raw);
  assert.equal(
    (
      await receiveWebhook(
        new Request("http://localhost", {
          method: "POST",
          body: raw + " ",
          headers: valid.headers,
        }),
        stripe,
        secret,
        processEvent,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await receiveWebhook(
        signedRequest(raw, Math.floor(Date.now() / 1000) - 600),
        stripe,
        secret,
        processEvent,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await receiveWebhook(
        signedRequest("x".repeat(1024 * 1024 + 1)),
        stripe,
        secret,
        processEvent,
      )
    ).status,
    413,
  );
  assert.equal(calls, 0);
});
test("concurrent reservations cannot oversell; duplicate requests reserve only once", async () => {
  const variants = catalog();
  const id = randomUUID();
  const orders = await Promise.all([
    reserve(4, variants, id),
    reserve(4, variants, id),
  ]);
  assert.equal(orders[0].id, orders[1].id);
  const result = await pool.query(
    `SELECT * FROM ${schema}.stock WHERE variant_id=$1`,
    [variants[0].id],
  );
  assert.equal(result.rows[0].reserved, 4);
  await assert.rejects(reserve(3, variants), /Not enough/);
  await assert.rejects(reserve(2, variants, id), /bag changed/);
  const next = catalog();
  const simultaneous = await Promise.allSettled([
    reserve(4, next),
    reserve(4, next),
  ]);
  assert.equal(simultaneous.filter((r) => r.status === "fulfilled").length, 1);
});
test("browser prices are rejected and failed reservations roll back", async () => {
  const variants = catalog();
  await assert.rejects(
    store.reserve(
      randomUUID(),
      [{ variantId: variants[0].id, quantity: 2, priceCents: 1 }],
      variants,
      "http://localhost",
      {},
    ),
  );
  await assert.rejects(reserve(7, variants), /Not enough/);
  assert.equal(
    (
      await pool.query(`SELECT * FROM ${schema}.stock WHERE variant_id=$1`, [
        variants[0].id,
      ])
    ).rowCount,
    0,
  );
});
test("verified payment persists exactly once across concurrent webhook deliveries", async () => {
  const order = await reserve();
  const paid = event(order);
  const responses = await Promise.all(
    [1, 2].map(() =>
      receiveWebhook(signedRequest(JSON.stringify(paid)), stripe, secret, (e) =>
        store.processEvent(e),
      ),
    ),
  );
  assert.deepEqual(
    responses.map((r) => r.status),
    [200, 200],
  );
  await store.processEvent(event(order)); // Different event ID, same payment.
  const saved = await store.findSession(
    (paid.data.object as Stripe.Checkout.Session).id,
  );
  assert.equal(saved.status, "paid");
  const stock = await pool.query(
    `SELECT * FROM ${schema}.stock WHERE variant_id=$1`,
    [order.quote.lines[0].variantId],
  );
  assert.equal(stock.rows[0].on_hand, 4);
  assert.equal(stock.rows[0].reserved, 0);
  await store.processEvent(
    event(order, "checkout.session.expired", {
      payment_status: "unpaid",
      status: "expired",
    }),
  );
  assert.equal(
    (await store.findSession((paid.data.object as Stripe.Checkout.Session).id))
      .status,
    "paid",
  );
});
test("amount, currency and session mismatches never mark an order paid or acknowledge the event", async () => {
  const order = await reserve();
  for (const overrides of [
    { amount_total: 1 },
    { currency: "eur" },
    { amount_subtotal: 1 },
  ]) {
    const invalid = event(order, undefined, overrides);
    const response = await receiveWebhook(
      signedRequest(JSON.stringify(invalid)),
      stripe,
      secret,
      (e) => store.processEvent(e),
    );
    assert.equal(response.status, 500);
    assert.equal(
      (
        await pool.query(`SELECT * FROM ${schema}.events WHERE id=$1`, [
          invalid.id,
        ])
      ).rowCount,
      0,
    );
  }
  const valid = event(order);
  await store.attachSession(
    order.id,
    valid.data.object as Stripe.Checkout.Session,
  );
  await assert.rejects(
    store.processEvent(
      event(order, undefined, { id: "cs_test_another_session" }),
    ),
    /session mismatch/,
  );
  assert.equal(
    (await store.findSession((valid.data.object as Stripe.Checkout.Session).id))
      .status,
    "pending",
  );
});
test("unpaid completion stays pending, expiration releases stock once, late payment requires review", async () => {
  const order = await reserve();
  const unpaid = event(order, undefined, { payment_status: "unpaid" });
  await store.processEvent(unpaid);
  assert.equal(
    (
      await store.findSession(
        (unpaid.data.object as Stripe.Checkout.Session).id,
      )
    ).status,
    "pending",
  );
  const expired = event(order, "checkout.session.expired", {
    payment_status: "unpaid",
    status: "expired",
  });
  await store.processEvent(expired);
  await store.processEvent(expired);
  await store.processEvent(
    event(order, "checkout.session.async_payment_succeeded"),
  );
  assert.equal(
    (
      await store.findSession(
        (unpaid.data.object as Stripe.Checkout.Session).id,
      )
    ).status,
    "review",
  );
  const stock = await pool.query(
    `SELECT * FROM ${schema}.stock WHERE variant_id=$1`,
    [order.quote.lines[0].variantId],
  );
  assert.equal(stock.rows[0].on_hand, 6);
  assert.equal(stock.rows[0].reserved, 0);
});
test("asynchronous failure releases reservation; unrelated and live events cannot fulfill orders", async () => {
  const order = await reserve();
  const failed = event(order, "checkout.session.async_payment_failed", {
    payment_status: "unpaid",
  });
  assert.equal(await store.processEvent(failed), "processed");
  assert.equal(
    (
      await store.findSession(
        (failed.data.object as Stripe.Checkout.Session).id,
      )
    ).status,
    "cancelled",
  );
  const unrelated = event(order, undefined, { metadata: {} });
  assert.equal(await store.processEvent(unrelated), "ignored");
  const live = { ...event(order), livemode: true };
  assert.equal(
    (
      await receiveWebhook(
        signedRequest(JSON.stringify(live)),
        stripe,
        secret,
        (e) => store.processEvent(e),
      )
    ).status,
    400,
  );
});
