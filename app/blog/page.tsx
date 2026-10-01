import { getContent } from "@/lib/content/server";
import { ContentBrowser } from "@/components/content-browser";
import { StoryInvitation } from "@/components/story-form";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/blog/page.tsx"];
  return { title: copy["copy-1"] };
}
export default function Page() {
  return (
    <>
      <ContentBrowser kind="blog" />
      <div className="site-container">
        <StoryInvitation />
      </div>
    </>
  );
}
