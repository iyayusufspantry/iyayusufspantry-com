import { PageHeading } from "@/components/catalog";
import { StoryForm } from "@/components/story-form";
import { stories, storiesEnabled } from "@/lib/operations/runtime";
import type { PublicStory } from "@/lib/operations/stories";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Community stories",
  description: "Food memories and traditions shared by the pantry community.",
};
export default async function Page() {
  const enabled = storiesEnabled();
  let published: PublicStory[] = [];
  let unavailable = false;
  if (enabled) {
    try {
      published = await stories().published();
    } catch {
      unavailable = true;
    }
  }
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow="Stories from our community"
        title="A taste of home, a story to share"
        description="Food connects us to people and places we love. These are the memories our community brings to the table."
      />
      {unavailable ? (
        <p role="status" className="notice">
          Community stories are temporarily unavailable. Please try again later.
        </p>
      ) : published.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {published.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-white p-7 min-w-0 break-words"
            >
              <h2>{item.title}</h2>
              <p className="eyebrow mt-3 normal-case">By {item.name}</p>
              <p className="whitespace-pre-wrap leading-8">{item.story}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="notice">
          Our community storybook is just beginning. Share a memory for Simbiat
          to review.
        </p>
      )}
      <StoryForm enabled={enabled} />
    </div>
  );
}
