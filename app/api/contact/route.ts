import {
  contactEnabled,
  mailConfigured,
  operations,
} from "@/lib/operations/runtime";
import {
  json,
  jsonInput,
  limitForm,
  operationFailure,
} from "@/lib/operations/http";
import { contactInput } from "@/lib/operations/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!contactEnabled())
    return json({ error: "The contact form is not available yet." }, 503);
  try {
    const body = await jsonInput(request);
    if (body.website)
      return json({ message: "Thank you. Your message has been received." });
    const input = contactInput(body);
    await limitForm(request, "contact", input.email);
    const notification =
      mailConfigured() && process.env.CONTACT_NOTIFICATION_EMAIL
        ? {
            from: process.env.EMAIL_FROM!,
            to: process.env.CONTACT_NOTIFICATION_EMAIL,
          }
        : undefined;
    await operations().contact(input, notification);
    return json({
      message: "Thank you. Your message has been received.",
      reference: input.id,
    });
  } catch (error) {
    return operationFailure(error);
  }
}
