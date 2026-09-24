import { requireOwner } from "@/lib/owner-auth";
import { payments } from "@/lib/payments/runtime";
import { OwnerStore } from "@/lib/payments/owner-store";
import { operations } from "@/lib/operations/runtime";
import { json, jsonInput, operationFailure } from "@/lib/operations/http";
import { OperationError, requestId } from "@/lib/operations/validation";
import { getContent } from "@/lib/content/server";
import { sampleStock } from "@/lib/commerce/sample";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireOwner();
    const page = Number(new URL(request.url).searchParams.get("page") || 0);
    if (!Number.isSafeInteger(page) || page < 0 || page > 10000)
      throw new OperationError(400, "Invalid page.");
    const { pool } = payments();
    const [checkout, communication, content] = await Promise.all([
      new OwnerStore(pool).overview(page),
      operations().overview(),
      getContent(),
    ]);
    const samples = sampleStock(content.variants);
    const stock = content.variants
      .filter((v) => v.active)
      .map((v) => {
        const existing = checkout.stock.find((s) => s.variant_id === v.id);
        return {
          variant_id: v.id,
          name: `${content.products.find((p) => p.slug === v.productSlug)?.name || v.productSlug} · ${v.size} · ${v.dietary}`,
          on_hand: existing?.on_hand ?? samples[v.id]?.onHand ?? 0,
          reserved: existing?.reserved ?? 0,
          initialized: !!existing,
        };
      });
    return json({ ...checkout, stock, ...communication, page });
  } catch (error) {
    return operationFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await requireOwner();
    const body = await jsonInput(request);
    if (body.action === "handle-message") {
      await operations().handleMessage(requestId(body.id));
    } else {
      const { pool } = payments();
      const store = new OwnerStore(pool);
      if (body.action === "fulfill")
        await store.fulfill(requestId(body.id), actor);
      else if (body.action === "stock") {
        const { variants } = await getContent();
        if (
          typeof body.variant !== "string" ||
          !variants.some((v) => v.active && v.id === body.variant)
        )
          throw new OperationError(400, "Unknown product variant.");
        const previous = body.expected as {
          onHand: number;
          reserved: number;
        } | null;
        if (
          previous !== null &&
          (!previous ||
            !Number.isSafeInteger(previous.onHand) ||
            !Number.isSafeInteger(previous.reserved))
        )
          throw new OperationError(400, "Invalid stock reference.");
        await store.stock(body.variant, body.onHand as number, previous, actor);
      } else throw new OperationError(400, "Unknown owner action.");
    }
    return json({ saved: true });
  } catch (error) {
    return operationFailure(error);
  }
}
