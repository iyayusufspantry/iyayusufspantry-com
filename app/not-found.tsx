import { getContent } from "@/lib/content/server";
import Link from "next/link";
import { EmptyState } from "@/components/catalog";
import { Button } from "@/components/ui/button";
export default async function NotFound() {
  const { copy: allCopy } = await getContent();
  const copy = allCopy["app/not-found.tsx"];

  return (
    <div className="site-container py-20">
      <EmptyState title={copy["copy-1"]} description={copy["copy-2"]}>
        <Button asChild>
          <Link href="/">{copy["copy-3"]}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/prototype">{copy["copy-4"]}</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
