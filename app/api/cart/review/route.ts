import { CommerceError, quoteCart, variants } from "@/lib/commerce/catalog";
import { availableStock } from "@/lib/commerce/orders";
import { sampleStock } from "@/lib/commerce/sample";

const headers = { "Cache-Control": "no-store" };
const maxBytes = 16384;

export async function POST(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return Response.json(
      { error: "Send a JSON cart.", code: "INVALID_CONTENT_TYPE" },
      { status: 415, headers },
    );
  // Bound streamed bodies too: Content-Length alone is not trustworthy.
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json(
      { error: "Choose some items first.", code: "INVALID_CART" },
      { status: 400, headers },
    );
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return Response.json(
          { error: "Cart request is too large.", code: "BODY_TOO_LARGE" },
          { status: 413, headers },
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => key !== "items") ||
      !("items" in body)
    )
      throw new CommerceError(
        "INVALID_CART",
        "Send only the cart items for review.",
      );
    const quote = quoteCart(
      body.items,
      variants,
      availableStock({ stock: sampleStock(), orders: [] }),
    );
    return Response.json(
      {
        ...quote,
        mode: "sample",
        paymentEnabled: false,
        shippingCents: null,
        taxCents: null,
        totalCents: null,
      },
      { headers },
    );
  } catch (error) {
    if (error instanceof CommerceError)
      return Response.json(
        { code: error.code, error: error.message },
        {
          status:
            error.code === "INSUFFICIENT_STOCK" ||
            error.code === "UNAVAILABLE_VARIANT"
              ? 409
              : 400,
          headers,
        },
      );
    if (error instanceof SyntaxError)
      return Response.json(
        { code: "INVALID_JSON", error: "The cart request is not valid JSON." },
        { status: 400, headers },
      );
    return Response.json(
      {
        code: "REVIEW_UNAVAILABLE",
        error: "Cart review is temporarily unavailable. Please try again.",
      },
      { status: 503, headers },
    );
  } finally {
    reader.releaseLock();
  }
}
