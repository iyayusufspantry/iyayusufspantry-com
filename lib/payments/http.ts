import type Stripe from "stripe";

export class BodyTooLarge extends Error {}
export async function readBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new BodyTooLarge();
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally {
    reader.releaseLock();
  }
}

export const privateHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};
export async function receiveWebhook(
  request: Request,
  stripe: Stripe,
  secret: string,
  processEvent: (event: Stripe.Event) => Promise<string>,
) {
  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return Response.json(
      { error: "Missing Stripe signature" },
      { status: 400, headers: privateHeaders },
    );
  let event: Stripe.Event;
  try {
    const raw = await readBody(request, 1024 * 1024);
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    return Response.json(
      { error: "Invalid webhook request" },
      {
        status: error instanceof BodyTooLarge ? 413 : 400,
        headers: privateHeaders,
      },
    );
  }
  if (event.livemode)
    return Response.json(
      { error: "Only sandbox events are accepted" },
      { status: 400, headers: privateHeaders },
    );
  try {
    const result = await processEvent(event);
    return Response.json(
      { received: true, result },
      { headers: privateHeaders },
    );
  } catch {
    // A non-2xx response lets Stripe retry. Never acknowledge failed writes.
    console.error("Stripe event processing failed", {
      eventId: event.id,
      type: event.type,
    });
    return Response.json(
      { error: "Event processing failed; retry delivery" },
      { status: 500, headers: privateHeaders },
    );
  }
}
