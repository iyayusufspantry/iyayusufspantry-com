import type Stripe from "stripe";
import type { PaymentStore } from "./store";
import type { PaymentOrder } from "./store";
import { mailConfigured, operations } from "../operations/runtime";

export async function queueOrderNotification(
  event: Stripe.Event,
  store: PaymentStore,
) {
  if (
    !mailConfigured() ||
    process.env.SANDBOX_ORDER_EMAILS !== "true" ||
    event.livemode
  )
    return;
  const session = event.data.object as Stripe.Checkout.Session;
  if (
    session.metadata?.integration !== "simbiat-sandbox-v1" ||
    !session.id?.startsWith("cs_test_")
  )
    return;
  const order = await store.findSession(session.id);
  if (!order || order.status !== "paid") return;
  await queueOrderEmail(order);
}

async function queueOrderEmail(order: PaymentOrder) {
  const email = order.customer_details?.email?.toLowerCase();
  const recipients = (process.env.EMAIL_TEST_RECIPIENTS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // Test-card purchases must never email arbitrary fictional/customer addresses.
  if (!email || !recipients.includes(email)) return;
  await operations().enqueue(`sandbox-order-${order.id}`, {
    from: process.env.EMAIL_FROM!,
    to: [email],
    subject: "Your pantry test payment is confirmed",
    text: `Test order ${order.id}\n\nYour sandbox payment of ${(order.quote.subtotalCents / 100).toFixed(2)} ${order.quote.currency} is confirmed.\n\nThis is a test order. No real payment was collected and no goods will be shipped.`,
  });
}

export async function recoverOrderNotifications() {
  if (!mailConfigured() || process.env.SANDBOX_ORDER_EMAILS !== "true") return;
  const recipients = (process.env.EMAIL_TEST_RECIPIENTS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!recipients.length) return;
  const result = await operations().pool.query<PaymentOrder>(
    `SELECT orders.* FROM simbiat_checkout_test.orders AS orders WHERE status='paid' AND lower(customer_details->>'email')=ANY($1::text[]) AND NOT EXISTS(SELECT 1 FROM simbiat_operations.mail WHERE id='sandbox-order-' || orders.id::text) ORDER BY created_at LIMIT 100`,
    [recipients],
  );
  for (const order of result.rows) await queueOrderEmail(order);
}
