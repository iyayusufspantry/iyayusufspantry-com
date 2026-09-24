import { createHmac } from "node:crypto";
import { BodyTooLarge, privateHeaders, readBody } from "../payments/http";
import { OperationError } from "./validation";
import { operations, siteOrigin } from "./runtime";

export const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      ...privateHeaders,
      ...(status === 429 ? { "Retry-After": "900" } : {}),
    },
  });
export async function jsonInput(request: Request) {
  if (request.headers.get("origin") !== siteOrigin())
    throw new OperationError(403, "Submit this form from our website.");
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new OperationError(415, "Send JSON data.");
  const input = JSON.parse(await readBody(request, 20000));
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new OperationError(400, "Invalid form data.");
  return input as Record<string, unknown>;
}
export async function limitForm(
  request: Request,
  kind: string,
  email?: string,
) {
  const secret = process.env.FORM_SECRET;
  if (!secret)
    throw new OperationError(503, "This form is temporarily unavailable.");
  const digest = (value: string) =>
    createHmac("sha256", secret).update(value).digest("hex");
  // Vercel supplies this header; do not trust an arbitrary forwarded-for chain.
  const client = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
      "unknown"
    : "local";
  const store = operations();
  await store.limit(`${kind}:global`, 200);
  await store.limit(`${kind}:client:${digest(client)}`, 20);
  if (email) await store.limit(`${kind}:email:${digest(email)}`, 5);
}
export function operationFailure(error: unknown) {
  if (error instanceof OperationError)
    return json({ error: error.message }, error.status);
  if (error instanceof BodyTooLarge)
    return json({ error: "The message is too large." }, 413);
  if (error instanceof SyntaxError)
    return json({ error: "Invalid JSON." }, 400);
  return json({ error: "Temporarily unavailable. Please try again." }, 503);
}
