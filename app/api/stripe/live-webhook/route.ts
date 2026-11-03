import { payments } from "@/lib/payments/runtime";
import { privateHeaders, receiveWebhook } from "@/lib/payments/http";
import { queueOrderNotification } from "@/lib/payments/notifications";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { stripe, config, store } = payments("live");
    return receiveWebhook(
      request,
      stripe,
      config.webhookSecret,
      async (event) => {
        const result = await store.processEvent(event);
        if (result !== "ignored") await queueOrderNotification(event, store);
        return result;
      },
      true,
    );
  } catch {
    return Response.json(
      { error: "Live payment service is not configured" },
      { status: 503, headers: privateHeaders },
    );
  }
}
