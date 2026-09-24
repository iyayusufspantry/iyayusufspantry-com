"use client";
import { useState } from "react";
import { Button } from "./ui/button";

export function NewsletterManage({
  action,
}: {
  action: "confirm" | "unsubscribe";
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className="site-container page-bottom py-16 max-w-2xl">
      <h1>
        {action === "confirm"
          ? "Confirm your subscription"
          : "Unsubscribe from the newsletter"}
      </h1>
      <p className="my-6">
        {action === "confirm"
          ? "Choose Confirm to receive pantry news and recipes."
          : "Choose Unsubscribe to stop receiving pantry news and recipes."}
      </p>
      <Button
        disabled={busy || done}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            const token = new URLSearchParams(
              window.location.hash.slice(1),
            ).get("token");
            const response = await fetch("/api/newsletter/manage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, action }),
              signal: AbortSignal.timeout(15000),
            });
            const result = await response.json();
            if (!response.ok)
              throw new Error(result.error || "Please try again.");
            setDone(true);
            setMessage(result.message);
            history.replaceState(null, "", window.location.pathname);
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Please try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Saving…"
          : action === "confirm"
            ? "Confirm subscription"
            : "Unsubscribe"}
      </Button>
      <p className="mt-4" role="status">
        {message}
      </p>
    </div>
  );
}
