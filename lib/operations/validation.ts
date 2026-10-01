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

export function storyInput(input: Record<string, unknown>) {
  if (input.consent !== true)
    throw new OperationError(
      400,
      "Please give permission to publish your story.",
    );
  return {
    id: requestId(input.requestId),
    name: textField(input.name, "Display name", 2, 80),
    email: emailAddress(input.email),
    title: textField(input.title, "Story title", 3, 120),
    story: textField(input.story, "Your story", 30, 5000),
  };
}
