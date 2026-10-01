import { requireOwner } from "@/lib/owner-auth";
import { stories } from "@/lib/operations/runtime";
import { json, jsonInput, operationFailure } from "@/lib/operations/http";
import { OperationError, requestId } from "@/lib/operations/validation";
import type { ReviewStory } from "@/lib/operations/stories";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireOwner();
    const params = new URL(request.url).searchParams;
    const status = params.get("status") || "pending";
    const page = Number(params.get("page") || 0);
    if (
      !["pending", "published", "declined"].includes(status) ||
      !Number.isSafeInteger(page) ||
      page < 0 ||
      page > 10000
    )
      throw new OperationError(400, "Invalid review filter.");
    return json({
      stories: await stories().reviewQueue(
        status as ReviewStory["status"],
        page,
      ),
    });
  } catch (error) {
    return operationFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await requireOwner();
    const body = await jsonInput(request);
    await stories().moderate(
      requestId(body.id),
      body.status as ReviewStory["status"],
      body.version as number,
      actor,
    );
    return json({ saved: true });
  } catch (error) {
    return operationFailure(error);
  }
}
