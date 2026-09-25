import nextEnv from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import Stripe from "stripe";
import { paymentConfig } from "../../lib/payments/config";

nextEnv.loadEnvConfig(process.cwd(), true);
const config = paymentConfig();
const publicTest = process.argv.includes("--public");
if (publicTest) config.origin = "https://www.iyayusufspantry.com";
if (
  !publicTest &&
  !new URL(config.origin).hostname.match(/^(localhost|127\.0\.0\.1)$/)
)
  throw new Error("Use --public to explicitly test the deployed sandbox.");
const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 10000,
});
const requestId = randomUUID();
const stripe = new Stripe(config.key);
let sessionId: string | undefined;
try {
  const body = JSON.stringify({
    requestId,
    items: [{ variantId: "plantain-chips:Small:Vegan", quantity: 1 }],
  });
  async function create() {
    const response = await fetch(`${config.origin}/api/checkout/session`, {
      method: "POST",
      headers: { Origin: config.origin, "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(60000),
    });
    assert.equal(
      response.status,
      200,
      `Checkout returned HTTP ${response.status}`,
    );
    return response.json();
  }
  const first = await create();
  const retry = await create();
  assert.equal(
    first.url,
    retry.url,
    "A retry should reuse the same Checkout Session",
  );
  const result = await pool.query(
    "SELECT session_id, quote FROM simbiat_checkout_test.orders WHERE id=$1",
    [requestId],
  );
  sessionId = result.rows[0].session_id;
  const session = await stripe.checkout.sessions.retrieve(sessionId!);
  assert.equal(session.livemode, false);
  assert.equal(session.amount_total, result.rows[0].quote.subtotalCents);
  assert.equal(session.status, "open");
  console.log(
    "Real Stripe sandbox Checkout Session created; server price and idempotent retry verified.",
  );
  await stripe.checkout.sessions.expire(session.id);
  for (let attempt = 0; attempt < 25; attempt++) {
    const response = await fetch(
      `${config.origin}/api/checkout/status?session_id=${session.id}`,
    );
    const order = await response.json();
    if (order.status === "cancelled") {
      if (publicTest) {
        let delivered = false;
        for (let retry = 0; retry < 15; retry++) {
          const events = await stripe.events.list({
            type: "checkout.session.expired",
            limit: 25,
          });
          const event = events.data.find(
            (event) =>
              event.type === "checkout.session.expired" &&
              event.data.object.id === session.id,
          );
          if (event?.pending_webhooks === 0) {
            delivered = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        assert.ok(
          delivered,
          "Stripe has not confirmed successful delivery to all enabled webhook destinations.",
        );
      }
      console.log(
        `Stripe delivered checkout.session.expired ${publicTest ? "to the deployed webhook" : "through the local listener"}. Signed webhook saved cancellation and released the reservation.`,
      );
      sessionId = undefined;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.equal(
    sessionId,
    undefined,
    "Webhook did not update the order. Check the destination or local listener, then retry reconciliation.",
  );
} catch (error) {
  // Do not print SDK/network error objects, which can include request credentials.
  console.error(
    error instanceof assert.AssertionError
      ? error.message
      : "Sandbox smoke check failed. Check the target server, webhook delivery, Stripe, and database connectivity.",
  );
  process.exitCode = 1;
} finally {
  if (sessionId) {
    try {
      await stripe.checkout.sessions.expire(sessionId);
    } catch {
      /* May already be expired. */
    }
  }
  await pool.end();
}
