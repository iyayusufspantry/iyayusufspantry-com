import Link from "next/link";
import { EmptyState } from "@/components/catalog";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="site-container py-20">
      <EmptyState
        title="This page isn’t in the pantry."
        description="The link may be out of date. Explore the storefront or view every proposed screen."
      >
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/prototype">All prototype screens</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
