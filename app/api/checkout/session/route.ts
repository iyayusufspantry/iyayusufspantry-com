import { getContent } from "@/lib/content/server";
import { CommerceError } from "@/lib/commerce/catalog";
import { checkoutEnabled } from "@/lib/payments/config";
import { BodyTooLarge, privateHeaders, readBody } from "@/lib/payments/http";
import { payments } from "@/lib/payments/runtime";
import { limitForm } from "@/lib/operations/http";
import { OperationError } from "@/lib/operations/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const reply = (status: number, error: string) =>
    Response.json({ error }, { status, headers: privateHeaders });
  if (!checkoutEnabled()) return reply(503, "Sandbox checkout is not enabled.");
  try {
    const { config, stripe, store } = payments();
    if (request.headers.get("origin") !== config.origin)
      return reply(403, "Open checkout from this website.");
    if (
      request.headers.get("content-type")?.split(";")[0].trim() !==
      "application/json"
    )
      return reply(415, "Send a JSON cart.");
    const body = JSON.parse(await readBody(request, 16384));
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => !["items", "requestId"].includes(key)) ||
      typeof body.requestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.requestId,
      )
    )
      return reply(400, "Invalid checkout request.");
    await limitForm(request, "checkout");
    const { variants, products } = await getContent();
    const order = await store.reserve(
      body.requestId,
      body.items,
      variants,
      config.origin,
      Object.fromEntries(products.map((p) => [p.slug, p.name])),
    );
    if (order.status !== "pending")
      return reply(409, "This checkout has ended. Start a new checkout.");
    // Stripe retains idempotency keys for at least 24h. Never recreate an older request.
    if (Date.now() - new Date(order.created_at).getTime() > 23 * 3600000)
      return reply(409, "This checkout has expired. Start a new checkout.");
    const session = order.session_id
      ? await stripe.checkout.sessions.retrieve(order.session_id)
      : await stripe.checkout.sessions.create(order.stripe_params, {
          idempotencyKey: `checkout-${order.id}`,
        });
    await store.attachSession(order.id, session);
    if (session.status !== "open" || !session.url)
      return reply(409, "This checkout has ended. Start a new checkout.");
    return Response.json({ url: session.url }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof OperationError)
      return reply(error.status, error.message);
    if (error instanceof BodyTooLarge)
      return reply(413, "Cart request is too large.");
    if (error instanceof SyntaxError) return reply(400, "Invalid JSON.");
    if (error instanceof CommerceError) return reply(409, error.message);
    console.error(
      "Sandbox checkout could not be created. Check Stripe and database connectivity.",
    );
    return reply(
      503,
      "Checkout is temporarily unavailable. Retry with the same bag.",
    );
  }
}
