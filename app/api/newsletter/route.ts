import {
  newsletterEnabled,
  operations,
  siteOrigin,
} from "@/lib/operations/runtime";
import {
  json,
  jsonInput,
  limitForm,
  operationFailure,
} from "@/lib/operations/http";
import { emailAddress, OperationError } from "@/lib/operations/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!newsletterEnabled())
    return json(
      { error: "Newsletter subscriptions are not available yet." },
      503,
    );
  try {
    const body = await jsonInput(request);
    const message =
      "If confirmation is needed, we’ll email you a link. You can unsubscribe at any time.";
    if (body.website) return json({ message });
    if (body.consent !== true)
      throw new OperationError(400, "Please agree to receive the newsletter.");
    const email = emailAddress(body.email);
    await limitForm(request, "newsletter", email);
    await operations().subscribe(email, siteOrigin(), process.env.EMAIL_FROM!);
    return json({ message });
  } catch (error) {
    return operationFailure(error);
  }
}
