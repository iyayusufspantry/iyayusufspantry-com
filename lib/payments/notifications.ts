import type Stripe from "stripe";
import type { PaymentStore } from "./store";
import type { PaymentOrder } from "./store";
import { mailConfigured, operations } from "../operations/runtime";
import { sandboxOrderEmail } from "../emails/messages";

export async function queueOrderNotification(
  event: Stripe.Event,
  store: PaymentStore,
) {
  if (
    !mailConfigured() ||
    (store.live
      ? process.env.LIVE_ORDER_EMAILS
      : process.env.SANDBOX_ORDER_EMAILS) !== "true" ||
    event.livemode !== store.live
  )
    return;
  const session = event.data.object as Stripe.Checkout.Session;
  if (
    session.metadata?.integration !== store.integration ||
    !session.id?.startsWith(store.live ? "cs_live_" : "cs_test_")
  )
    return;
  const order = await store.findSession(session.id);
  if (!order || order.status !== "paid") return;
  await queueOrderEmail(order, store.live);
}

async function queueOrderEmail(order: PaymentOrder, live = false) {
  const email = order.customer_details?.email?.toLowerCase();
  const recipients = (process.env.EMAIL_TEST_RECIPIENTS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // Test-card purchases must never email arbitrary fictional/customer addresses.
  if (!email || (!live && !recipients.includes(email))) return;
  await operations().enqueue(`${live ? "live" : "sandbox"}-order-${order.id}`, {
    from: process.env.EMAIL_FROM!,
    to: [email],
    subject: live
      ? "Your pantry payment is confirmed"
      : "Your pantry test payment is confirmed",
    ...(await sandboxOrderEmail({
      reference: order.id,
      subtotalCents: order.quote.totalCents ?? order.quote.subtotalCents,
      currency: order.quote.currency,
      live,
    })),
  });
}

export async function recoverOrderNotifications() {
  if (!mailConfigured()) return;
  const recipients = (process.env.EMAIL_TEST_RECIPIENTS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  for (const live of [false, true]) {
    if (
      (live
        ? process.env.LIVE_ORDER_EMAILS
        : process.env.SANDBOX_ORDER_EMAILS) !== "true"
    )
      continue;
    if (!live && !recipients.length) continue;
    const schema = live ? "simbiat_checkout_live" : "simbiat_checkout_test";
    const prefix = live ? "live" : "sandbox";
    const result = await operations().pool.query<PaymentOrder>(
      `SELECT orders.* FROM ${schema}.orders AS orders WHERE status='paid' ${live ? "" : "AND lower(customer_details->>'email')=ANY($1::text[])"} AND NOT EXISTS(SELECT 1 FROM simbiat_operations.mail WHERE id='${prefix}-order-' || orders.id::text) ORDER BY created_at LIMIT 100`,
      live ? [] : [recipients],
    );
    for (const order of result.rows) await queueOrderEmail(order, live);
  }
}
