export class OperationError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function emailAddress(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.trim())
  )
    throw new OperationError(400, "Enter a valid email address.");
  return value.trim().toLowerCase();
}

export function textField(
  value: unknown,
  label: string,
  min: number,
  max: number,
) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max ||
    /\u0000/.test(value)
  )
    throw new OperationError(
      400,
      `${label} must contain ${min}–${max} characters.`,
    );
  return value.trim();
}

export function requestId(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new OperationError(400, "Invalid request reference.");
  return value;
}

export function contactInput(input: Record<string, unknown>) {
  if (!["general", "product", "order", "other"].includes(String(input.subject)))
    throw new OperationError(400, "Choose a message subject.");
  return {
    id: requestId(input.requestId),
    name: textField(input.name, "Name", 2, 120),
    email: emailAddress(input.email),
    subject: String(input.subject),
    message: textField(input.message, "Message", 10, 5000),
  };
}
