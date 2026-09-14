import { ContentBrowser } from "@/components/content-browser";
export const metadata = { title: "The journal" };
export default function Page() {
  return <ContentBrowser kind="blog" />;
}
