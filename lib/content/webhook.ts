import { createHash, timingSafeEqual } from "node:crypto";

export const CONTENTFUL_TOPICS = [
  "Entry.publish",
  "Entry.unpublish",
  "Entry.delete",
  "Asset.publish",
  "Asset.unpublish",
  "Asset.delete",
];
type Config = { secret?: string; space?: string; environment: string };
export type ContentEvent = {
  kind: "entries" | "assets";
  id: string;
  removed: boolean;
  publishedAt?: string;
};
const headers = { "Cache-Control": "no-store" };
const reply = (status: number, message: string) =>
  Response.json({ message }, { status, headers });

export async function handleContentfulWebhook(
  request: Request,
  config: Config,
  invalidate: (event: ContentEvent) => Promise<void>,
) {
  if (!config.secret || !config.space)
    return reply(503, "Revalidation is not configured");
  const given = request.headers.get("x-contentful-webhook-secret") || "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(given), digest(config.secret)))
    return reply(401, "Unauthorized");
  const topic =
    request.headers
      .get("x-contentful-topic")
      ?.replace(/^ContentManagement\./, "") || "";
  if (!CONTENTFUL_TOPICS.includes(topic))
    return reply(400, "Unsupported content event");
  const reader = request.body?.getReader();
  if (!reader) return reply(400, "Missing event body");
  try {
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 262144) {
        await reader.cancel();
        return reply(413, "Event body is too large");
      }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (
      body?.sys?.space?.sys?.id !== config.space ||
      body?.sys?.environment?.sys?.id !== config.environment
    )
      return reply(400, "Wrong content environment");
    if (typeof body.sys.id !== "string" || !/^[\w-]{1,128}$/.test(body.sys.id))
      return reply(400, "Invalid content identifier");
    await invalidate({
      kind: topic.startsWith("Entry.") ? "entries" : "assets",
      id: body.sys.id,
      removed: !topic.endsWith(".publish"),
      publishedAt: body.sys.publishedAt,
    });
    return Response.json({ revalidated: true }, { headers });
  } catch (error) {
    if (error instanceof SyntaxError) return reply(400, "Invalid JSON");
    // Non-2xx allows Contentful to retry instead of losing the invalidation.
    return reply(503, "Content delivery is catching up; retry this event");
  } finally {
    reader.releaseLock();
  }
}
