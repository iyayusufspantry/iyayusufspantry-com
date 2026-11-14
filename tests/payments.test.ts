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
import { paymentConfig, checkoutEnabled } from "../lib/payments/config";
import type { Variant } from "../lib/commerce/catalog";

loadEnvConfig(process.cwd());
const schema = `payment_test_${randomUUID().replaceAll("-", "")}`;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 4,
});
const store = new PaymentStore(pool, schema);
const liveSchema = `${schema}_live`;
const liveStore = new PaymentStore(pool, liveSchema, { live: true });
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
  await pool.query(sql.replaceAll("simbiat_checkout_test", liveSchema));
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
  await pool.query(`DROP SCHEMA IF EXISTS ${liveSchema} CASCADE`);
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

async function liveReservation(priceCents = 800, quantity = 2) {
  const v = {
    ...variant,
    id: randomUUID(),
    productSlug: "i-rock-with-iya-yusufs-pantry-shirt",
    priceCents,
  };
  await pool.query(
    `INSERT INTO ${liveSchema}.stock(variant_id,on_hand) VALUES($1,10)`,
    [v.id],
  );
  const order = await liveStore.reserve(
    randomUUID(),
    [{ variantId: v.id, quantity }],
    [v],
    "https://pantry.example",
    {},
  );
  return { order, variant: v };
}
function liveEvent(
  order: PaymentOrderLike,
  overrides: Record<string, unknown> = {},
) {
  const shipping = order.quote.shippingCents ?? 0;
  return {
    ...event(order, "checkout.session.completed", {
      id: `cs_live_${order.id.replaceAll("-", "")}`,
      livemode: true,
      metadata: { order_id: order.id, integration: "simbiat-live-v1" },
      amount_total: order.quote.subtotalCents + shipping + 179,
      total_details: {
        amount_shipping: shipping,
        amount_tax: 179,
        amount_discount: 0,
      },
      automatic_tax: { enabled: true, status: "complete" },
      ...overrides,
    }),
    livemode: true,
  } as Stripe.Event;
}
type PaymentOrderLike = Awaited<ReturnType<typeof reserve>>;

test("live checkout requires explicit mode and tax readiness, and keeps its credentials separate", () => {
  const names = [
    "STRIPE_PAYMENT_MODE",
    "STRIPE_API_KEY",
    "STRIPE_LIVE_WEBHOOK_SECRET",
    "STRIPE_CHECKOUT_ENABLED",
    "STRIPE_LIVE_TAX_READY",
    "APP_URL",
  ] as const;
  const saved = Object.fromEntries(names.map((key) => [key, process.env[key]]));
  try {
    Object.assign(process.env, {
      STRIPE_PAYMENT_MODE: "live",
      STRIPE_API_KEY: "sk_live_unit_only",
      STRIPE_LIVE_WEBHOOK_SECRET: secret,
      STRIPE_CHECKOUT_ENABLED: "true",
      APP_URL: "https://pantry.example",
    });
    delete process.env.STRIPE_LIVE_TAX_READY;
    assert.equal(checkoutEnabled(), false);
    assert.equal(paymentConfig().schema, "simbiat_checkout_live");
    assert.equal(paymentConfig().key, "sk_live_unit_only");
    process.env.STRIPE_LIVE_TAX_READY = "true";
    assert.equal(checkoutEnabled(), true);
    process.env.STRIPE_API_KEY = "sk_test_wrong_mode";
    assert.equal(checkoutEnabled(), false);
    assert.throws(
      () => new PaymentStore(pool, "simbiat_checkout_test", { live: true }),
      /separate/,
    );
  } finally {
    for (const key of names) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

test("live checkout never seeds sample stock and calculates approved shipping server-side", async () => {
  const [v] = catalog();
  await assert.rejects(
    liveStore.reserve(
      randomUUID(),
      [{ variantId: v.id, quantity: 1 }],
      [v],
      "https://pantry.example",
      {},
    ),
    /Not enough stock/,
  );
  assert.equal(
    (
      await pool.query(
        `SELECT * FROM ${liveSchema}.stock WHERE variant_id=$1`,
        [v.id],
      )
    ).rowCount,
    0,
  );
  const { order } = await liveReservation();
  assert.equal(order.quote.shippingCents, 699);
  assert.equal(order.stripe_params.automatic_tax?.enabled, true);
  assert.equal(order.stripe_params.metadata?.integration, "simbiat-live-v1");
  assert.equal(
    order.stripe_params.line_items?.[0].price_data?.product_data?.tax_code,
    "txcd_30011000",
  );
  const free = await liveReservation(3000, 2);
  assert.equal(free.order.quote.shippingCents, 0);
  assert.equal(
    free.order.stripe_params.shipping_options?.[0].shipping_rate_data
      ?.fixed_amount?.amount,
    0,
  );
});

test("unreviewed and new live products reject the entire mixed cart without reserving stock", async () => {
  for (const slug of [
    "tiger-nut-drink",
    "classic-chin-chin",
    "new-product",
    "toString",
  ]) {
    const id = randomUUID();
    const items = [
      { ...variant, id: randomUUID(), productSlug: "palm-oil" },
      { ...variant, id: randomUUID(), productSlug: slug },
    ];
    for (const v of items)
      await pool.query(
        `INSERT INTO ${liveSchema}.stock(variant_id,on_hand) VALUES($1,10)`,
        [v.id],
      );
    await assert.rejects(
      liveStore.reserve(
        id,
        items.map((v) => ({ variantId: v.id, quantity: 1 })),
        items,
        "https://pantry.example",
        {},
      ),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "TAX_REVIEW_REQUIRED",
    );
    assert.equal(
      (
        await pool.query(`SELECT id FROM ${liveSchema}.orders WHERE id=$1`, [
          id,
        ])
      ).rowCount,
      0,
    );
    const stock = await pool.query(
      `SELECT on_hand,reserved FROM ${liveSchema}.stock WHERE variant_id=ANY($1::text[])`,
      [items.map((v) => v.id)],
    );
    assert.deepEqual(stock.rows, [
      { on_hand: 10, reserved: 0 },
      { on_hand: 10, reserved: 0 },
    ]);
  }
});

test("mixed live carts preserve distinct food/apparel/candy tax codes and free-shipping threshold", async () => {
  const items = [
    { ...variant, id: randomUUID(), productSlug: "palm-oil", priceCents: 2500 },
    {
      ...variant,
      id: randomUUID(),
      productSlug: "pantry-people-cap",
      priceCents: 3500,
    },
    {
      ...variant,
      id: randomUUID(),
      productSlug: "coconut-candy-crunch",
      priceCents: 1000,
    },
  ];
  for (const v of items)
    await pool.query(
      `INSERT INTO ${liveSchema}.stock(variant_id,on_hand) VALUES($1,10)`,
      [v.id],
    );
  const order = await liveStore.reserve(
    randomUUID(),
    items.map((v) => ({ variantId: v.id, quantity: 1 })),
    items,
    "https://pantry.example",
    {},
  );
  const codes = order.stripe_params.line_items
    ?.map((line) => line.price_data?.product_data?.tax_code)
    .sort();
  assert.deepEqual(codes, ["txcd_30060006", "txcd_40020002", "txcd_40100001"]);
  assert.equal(order.quote.subtotalCents, 7000);
  assert.equal(order.quote.shippingCents, 0);
  assert.ok(
    order.stripe_params.line_items?.every(
      (line) => line.price_data?.tax_behavior === "exclusive",
    ),
  );
  assert.equal(order.stripe_params.automatic_tax?.enabled, true);
});

test("live payment records shipping and tax exactly once without touching sandbox stock", async () => {
  const { order, variant: v } = await liveReservation();
  await pool.query(
    `INSERT INTO ${schema}.stock(variant_id,on_hand) VALUES($1,99)`,
    [v.id],
  );
  const paid = liveEvent(order);
  const replies = await Promise.all(
    [1, 2].map(() =>
      receiveWebhook(
        signedRequest(JSON.stringify(paid)),
        stripe,
        secret,
        (e) => liveStore.processEvent(e),
        true,
      ),
    ),
  );
  assert.deepEqual(
    replies.map((r) => r.status),
    [200, 200],
  );
  const saved = await liveStore.findSession(
    (paid.data.object as Stripe.Checkout.Session).id,
  );
  assert.equal(saved.status, "paid");
  assert.equal(saved.quote.totalCents, 2478);
  assert.equal(saved.quote.taxCents, 179);
  assert.equal(saved.quote.shippingCents, 699);
  assert.equal(
    (
      await pool.query(
        `SELECT on_hand FROM ${liveSchema}.stock WHERE variant_id=$1`,
        [v.id],
      )
    ).rows[0].on_hand,
    8,
  );
  assert.equal(
    (
      await pool.query(
        `SELECT on_hand FROM ${schema}.stock WHERE variant_id=$1`,
        [v.id],
      )
    ).rows[0].on_hand,
    99,
  );
  await assert.rejects(store.processEvent(paid), /mode mismatch/);
});

test("live webhook rejects wrong shipping, incomplete tax, discounts and mismatched totals", async () => {
  const { order } = await liveReservation();
  for (const override of [
    { amount_total: 1 },
    {
      amount_total: 1779,
      total_details: {
        amount_shipping: 0,
        amount_tax: 179,
        amount_discount: 0,
      },
    },
    { automatic_tax: { enabled: true, status: "requires_location_inputs" } },
    {
      total_details: {
        amount_shipping: 699,
        amount_tax: -1,
        amount_discount: 0,
      },
      amount_total: 2298,
    },
    {
      total_details: {
        amount_shipping: 699,
        amount_tax: 179,
        amount_discount: 10,
      },
    },
    { currency: "eur" },
  ])
    await assert.rejects(
      liveStore.processEvent(liveEvent(order, override)),
      /amount or currency mismatch/,
    );
  assert.equal(
    (
      await pool.query(`SELECT status FROM ${liveSchema}.orders WHERE id=$1`, [
        order.id,
      ])
    ).rows[0].status,
    "pending",
  );
  const payload = JSON.stringify(liveEvent(order));
  assert.equal(
    (
      await receiveWebhook(signedRequest(payload), stripe, secret, (e) =>
        liveStore.processEvent(e),
      )
    ).status,
    400,
  );
});

test("live expiration releases only its reservation and late payment requires review", async () => {
  const { order, variant: v } = await liveReservation();
  const expired = liveEvent(order, {
    payment_status: "unpaid",
    status: "expired",
  });
  expired.type = "checkout.session.expired";
  await liveStore.processEvent(expired);
  await liveStore.processEvent(expired);
  const row = (
    await pool.query(
      `SELECT on_hand,reserved FROM ${liveSchema}.stock WHERE variant_id=$1`,
      [v.id],
    )
  ).rows[0];
  assert.deepEqual(row, { on_hand: 10, reserved: 0 });
  await liveStore.processEvent(liveEvent(order));
  assert.equal(
    (
      await liveStore.findSession(
        (expired.data.object as Stripe.Checkout.Session).id,
      )
    ).status,
    "review",
  );
  assert.deepEqual(
    (
      await pool.query(
        `SELECT on_hand,reserved FROM ${liveSchema}.stock WHERE variant_id=$1`,
        [v.id],
      )
    ).rows[0],
    row,
  );
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
