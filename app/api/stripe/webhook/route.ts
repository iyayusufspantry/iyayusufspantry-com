import { payments } from "@/lib/payments/runtime";
import { privateHeaders, receiveWebhook } from "@/lib/payments/http";
import { queueOrderNotification } from "@/lib/payments/notifications";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { stripe, config, store } = payments();
    return receiveWebhook(
      request,
      stripe,
      config.webhookSecret,
      async (event) => {
        const result = await store.processEvent(event);
        // Also run on duplicate delivery: a previous outbox write may have failed
        // after the payment transaction committed. Queue keys prevent duplicates.
        if (result !== "ignored") await queueOrderNotification(event, store);
        return result;
      },
    );
  } catch {
    return Response.json(
      { error: "Payment service is not configured" },
      { status: 503, headers: privateHeaders },
    );
  }
}
