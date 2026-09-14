import { ContentBrowser } from "@/components/content-browser";
export const metadata = { title: "Recipes" };
export default function Page() {
  return <ContentBrowser kind="recipes" />;
}
