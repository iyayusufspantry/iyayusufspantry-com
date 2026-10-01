"use client";
import { useCallback, useEffect, useState } from "react";
import type { ReviewStory } from "@/lib/operations/stories";
import { Button } from "./ui/button";

export function OwnerStories() {
  const [status, setStatus] = useState<ReviewStory["status"]>("pending");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ReviewStory[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch(
      `/api/owner/stories?status=${status}&page=${page}`,
      { cache: "no-store", signal: AbortSignal.timeout(20000) },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Could not load stories.");
    return result.stories as ReviewStory[];
  }, [status, page]);
  useEffect(() => {
    let active = true;
    refresh()
      .then((result) => {
        if (active) {
          setItems(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  async function moderate(item: ReviewStory, next: ReviewStory["status"]) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/owner/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: next,
          version: item.version,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not save this review.");
      setItems(await refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="site-container py-10">
      <h2>Community story reviews</h2>
      <p className="my-4">
        Read each submission before publishing. Only the display name, title,
        and story appear on the{" "}
        <a className="underline" href="/stories">
          community stories page
        </a>
        . Email addresses remain private.
      </p>
      <div className="flex flex-wrap gap-3 my-5">
        {(["pending", "published", "declined"] as const).map((filter) => (
          <Button
            key={filter}
            variant={status === filter ? "default" : "outline"}
            disabled={busy || loading}
            aria-pressed={status === filter}
            onClick={() => {
              if (status === filter && page === 0) return;
              setLoading(true);
              setPage(0);
              setStatus(filter);
            }}
          >
            {filter === "pending"
              ? "Awaiting review"
              : filter === "published"
                ? "Published"
                : "Declined"}
          </Button>
        ))}
        <Button
          variant="outline"
          disabled={busy || loading}
          onClick={async () => {
            setLoading(true);
            try {
              setItems(await refresh());
              setError("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Please try again.");
            } finally {
              setLoading(false);
            }
          }}
        >
          Refresh stories
        </Button>
      </div>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading stories…</p>
      ) : (
        <>
          {!error && !items.length && <p>No stories in this view.</p>}
          {items.map((item) => (
            <article
              key={item.id}
              className="my-5 rounded-xl border border-border p-6 break-words"
            >
              <h3>{item.title}</h3>
              <p className="my-2">
                By {item.name} · {item.email}
              </p>
              <p className="fine-print">
                Submitted {new Date(item.created_at).toLocaleDateString()}
              </p>
              <p className="my-5 whitespace-pre-wrap">{item.story}</p>
              <div className="flex flex-wrap gap-3">
                {item.status !== "published" && (
                  <Button
                    disabled={busy}
                    onClick={() => moderate(item, "published")}
                  >
                    Publish story
                  </Button>
                )}
                {item.status === "published" && (
                  <Button
                    disabled={busy}
                    variant="outline"
                    onClick={() => moderate(item, "pending")}
                  >
                    Unpublish story
                  </Button>
                )}
                {item.status !== "declined" && (
                  <Button
                    disabled={busy}
                    variant="outline"
                    onClick={() => moderate(item, "declined")}
                  >
                    Decline story
                  </Button>
                )}
                {item.status === "declined" && (
                  <Button
                    disabled={busy}
                    variant="outline"
                    onClick={() => moderate(item, "pending")}
                  >
                    Return to review
                  </Button>
                )}
              </div>
            </article>
          ))}
        </>
      )}
      <div className="flex gap-3 mt-5">
        <Button
          variant="outline"
          disabled={busy || loading || page === 0}
          onClick={() => {
            setLoading(true);
            setPage(page - 1);
          }}
        >
          Previous stories
        </Button>
        <Button
          variant="outline"
          disabled={busy || loading || items.length < 25}
          onClick={() => {
            setLoading(true);
            setPage(page + 1);
          }}
        >
          Next stories
        </Button>
      </div>
    </section>
  );
}
