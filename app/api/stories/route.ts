import { stories, storiesEnabled } from "@/lib/operations/runtime";
import {
  json,
  jsonInput,
  limitForm,
  operationFailure,
} from "@/lib/operations/http";
import { storyInput } from "@/lib/operations/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!storiesEnabled())
    return json(
      { error: "Story submissions are temporarily unavailable." },
      503,
    );
  try {
    const body = await jsonInput(request);
    const message =
      "Thank you for sharing. Simbiat will review your story before it appears on the website.";
    if (body.website) return json({ message });
    const input = storyInput(body);
    await limitForm(request, "story", input.email);
    await stories().submit(input);
    return json({ message });
  } catch (error) {
    return operationFailure(error);
  }
}
