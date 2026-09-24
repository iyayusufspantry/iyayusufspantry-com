import nextEnv from "@next/env";
import { Pool } from "pg";
import Stripe from "stripe";
import { paymentConfig } from "../../lib/payments/config";
import { PaymentStore } from "../../lib/payments/store";

nextEnv.loadEnvConfig(process.cwd());
const config = paymentConfig();
const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 10000,
});
try {
  const stripe = new Stripe(config.key, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
  const store = new PaymentStore(pool);
  const orders = await store.pending();
  let updated = 0;
  let manual = 0;
  for (const order of orders) {
    // Replay uncertain creates with the original parameters and key, within Stripe's retention window.
    if (
      !order.session_id &&
      Date.now() - new Date(order.created_at).getTime() > 23 * 3600000
    ) {
      manual++;
      continue;
    }
    const session = order.session_id
      ? await stripe.checkout.sessions.retrieve(order.session_id)
      : await stripe.checkout.sessions.create(order.stripe_params, {
          idempotencyKey: `checkout-${order.id}`,
        });
    await store.attachSession(order.id, session);
    if (session.status !== "expired" && session.payment_status !== "paid")
      continue;
    const type =
      session.payment_status === "paid"
        ? "checkout.session.completed"
        : "checkout.session.expired";
    // This event is synthesized only from an authenticated server-to-Stripe API retrieval.
    await store.processEvent({
      id: `reconcile_${session.id}_${type}`,
      object: "event",
      api_version: null,
      created: Math.floor(Date.now() / 1000),
      pending_webhooks: 0,
      request: null,
      type,
      livemode: session.livemode,
      data: { object: session },
    } as Stripe.Event);
    updated++;
  }
  console.log(
    JSON.stringify({
      checked: orders.length,
      updated,
      manualReviewRequired: manual,
    }),
  );
} catch {
  console.error(
    "Reconciliation failed. Check Stripe/database connectivity and retry. Reservations were not released without provider confirmation.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
