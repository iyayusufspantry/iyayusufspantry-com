import { operations } from "@/lib/operations/runtime";
import {
  json,
  jsonInput,
  limitForm,
  operationFailure,
} from "@/lib/operations/http";
import { OperationError } from "@/lib/operations/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await jsonInput(request);
    if (
      (body.action !== "confirm" && body.action !== "unsubscribe") ||
      typeof body.token !== "string"
    )
      throw new OperationError(400, "Invalid subscription link.");
    await limitForm(request, "newsletter-link");
    await operations().subscriptionAction(body.token, body.action);
    return json({
      message:
        body.action === "confirm"
          ? "You’re subscribed. Thank you for joining our pantry."
          : "You’ve been unsubscribed.",
    });
  } catch (error) {
    return operationFailure(error);
  }
}
