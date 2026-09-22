"use client";
import { useContent } from "@/components/content-provider";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { copy: allCopy } = useContent();
  const copy = allCopy["app/error.tsx"];

  return (
    <div className="site-container py-20">
      <div className="empty-state">
        <h2>{copy["copy-1"]}</h2>
        <p>{copy["copy-2"]}</p>
        <Button onClick={reset} className="mt-5">
          {" "}
          {copy["copy-3"]}{" "}
        </Button>
      </div>
    </div>
  );
}
