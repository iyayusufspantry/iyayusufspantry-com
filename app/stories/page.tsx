import { PageHeading } from "@/components/catalog";
import { StoryForm, StoryShareButton } from "@/components/story-form";
import { CommunityStories } from "@/components/community-stories";
import { stories, storiesEnabled } from "@/lib/operations/runtime";
import type { PublicStory } from "@/lib/operations/stories";
import { getContent } from "@/lib/content/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Community stories",
  description: "Food memories and traditions shared by the pantry community.",
};
export default async function Page() {
  const { posts, journalPhotos } = await getContent();
  const editorialStories = posts.filter(
    (post) => post.approved && post.category === "Community stories",
  );
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
    <div className="site-container page-bottom stories-page">
      <PageHeading
        eyebrow="Stories from our community"
        title="A taste of home, a story to share"
        description="Food connects us to people and places we love. These are the memories our community brings to the table."
      >
        <StoryShareButton />
      </PageHeading>
      <div className="stories-layout">
        <div className="stories-collection">
          {(editorialStories.length > 0 || published.length > 0) && (
            <CommunityStories
              stories={[
                ...editorialStories.map((post) => ({
                  id: `editorial-${post.slug}`,
                  title: post.title,
                  author: post.author ?? "",
                  excerpt: post.description,
                  sections: post.sections,
                  href: `/blog/${post.slug}`,
                  photo: journalPhotos[post.slug],
                  readTime: post.readTime,
                })),
                ...published.map((item) => ({
                  id: item.id,
                  title: item.title,
                  author: item.name,
                  excerpt:
                    item.story.length > 180
                      ? `${item.story.slice(0, 180).trimEnd()}…`
                      : item.story,
                  sections: [{ text: item.story }],
                })),
              ]}
            />
          )}
          {unavailable ? (
            <p role="status" className="notice">
              Community stories are temporarily unavailable. Please try again
              later.
            </p>
          ) : published.length || editorialStories.length ? null : (
            <p className="notice">
              Our community storybook is just beginning. Share a memory for
              Simbiat to review.
            </p>
          )}
        </div>
        <StoryForm enabled={enabled} />
      </div>
    </div>
  );
}
