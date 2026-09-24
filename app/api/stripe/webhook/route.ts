import { payments } from "@/lib/payments/runtime";
import { privateHeaders, receiveWebhook } from "@/lib/payments/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { stripe, config, store } = payments();
    return receiveWebhook(request, stripe, config.webhookSecret, (event) =>
      store.processEvent(event),
    );
  } catch {
    return Response.json(
      { error: "Payment service is not configured" },
      { status: 503, headers: privateHeaders },
    );
  }
}
