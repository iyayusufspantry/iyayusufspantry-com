import { payments } from "@/lib/payments/runtime";
import { privateHeaders } from "@/lib/payments/http";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_test_[A-Za-z0-9]{10,240}$/.test(sessionId))
    return Response.json(
      { error: "Invalid session" },
      { status: 400, headers: privateHeaders },
    );
  try {
    const order = await payments().store.findSession(sessionId);
    if (!order)
      return Response.json(
        { error: "Order not found" },
        { status: 404, headers: privateHeaders },
      );
    // Session ID is an unguessable bearer reference; no personal details are returned.
    return Response.json(
      {
        status: order.status,
        reference: order.id,
        totalCents: order.quote.subtotalCents,
        currency: order.quote.currency,
      },
      { headers: privateHeaders },
    );
  } catch {
    return Response.json(
      { error: "Order status is temporarily unavailable" },
      { status: 503, headers: privateHeaders },
    );
  }
}
