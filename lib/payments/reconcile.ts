import type Stripe from "stripe";
import type { PaymentStore } from "./store";

export async function reconcilePayments(
  stripe: Stripe,
  store: PaymentStore,
  notify?: (event: Stripe.Event) => Promise<void>,
  limit = 100,
) {
  const orders = (await store.pending()).slice(0, limit);
  let updated = 0;
  let manual = 0;
  let failed = 0;
  for (const order of orders) {
    // Rotate the bounded batch so old unresolved orders cannot starve newer ones.
    await store.markReconciled(order.id);
    if (
      !order.session_id &&
      Date.now() - new Date(order.created_at).getTime() > 23 * 3600000
    ) {
      manual++;
      continue;
    }
    try {
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
      const event = {
        id: `reconcile_${session.id}_${type}`,
        object: "event",
        api_version: null,
        created: Math.floor(Date.now() / 1000),
        pending_webhooks: 0,
        request: null,
        type,
        livemode: session.livemode,
        data: { object: session },
      } as Stripe.Event;
      await store.processEvent(event);
      if (notify) await notify(event);
      updated++;
    } catch {
      failed++;
    }
  }
  return {
    checked: orders.length,
    updated,
    manualReviewRequired: manual,
    failed,
  };
}
