"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="site-container py-20">
      <div className="empty-state">
        <h2>Something needs a fresh start.</h2>
        <p>Please try loading this prototype screen again.</p>
        <Button onClick={reset} className="mt-5">
          Try again
        </Button>
      </div>
    </div>
  );
}
