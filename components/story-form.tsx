"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "./ui/button";

export function StoryInvitation() {
  return (
    <section className="story-invitation rounded-2xl border border-border bg-white p-7 my-10">
      <span className="eyebrow">Stories from our community</span>
      <h2>What tastes like home to you?</h2>
      <p className="my-4">
        A childhood snack, a family recipe, a meal shared with friends. Share
        your memory with the pantry. Simbiat reviews every story before
        publication.
      </p>
      <Button asChild>
        <Link href="/stories#share-story">Share your story</Link>
      </Button>
      <Link href="/stories" className="text-link ml-5 mt-4">
        Read community stories
      </Link>
    </section>
  );
}

export function StoryForm({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);
  return (
    <section id="share-story" className="section scroll-mt-24">
      <form
        className="contact-form mx-auto max-w-3xl"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || !enabled) return;
          const form = event.currentTarget;
          const fields = Object.fromEntries(new FormData(form));
          const fingerprint = JSON.stringify(fields);
          if (submission.current?.fingerprint !== fingerprint)
            submission.current = { fingerprint, id: crypto.randomUUID() };
          setBusy(true);
          setStatus("");
          setFailed(false);
          try {
            const response = await fetch("/api/stories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...fields,
                consent: fields.consent === "on",
                requestId: submission.current.id,
              }),
              signal: AbortSignal.timeout(15000),
            });
            const result = await response.json();
            if (!response.ok)
              throw new Error(result.error || "Please try again.");
            setStatus(result.message);
            form.reset();
            submission.current = null;
          } catch (error) {
            setFailed(true);
            setStatus(
              error instanceof Error ? error.message : "Please try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="eyebrow">Your place at the table</span>
        <h2>Share your story</h2>
        <p className="my-4">
          Tell us about the food, people, and traditions that bring you home.
          Your story will be sent to Simbiat for review.
        </p>
        {!enabled && (
          <p className="notice my-4">
            Story submissions are temporarily unavailable. Please come back
            soon.
          </p>
        )}
        <fieldset disabled={busy || !enabled}>
          <div hidden aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="form-grid grid-cols-1! sm:grid-cols-2!">
            <div className="field">
              <label htmlFor="story-name">Display name</label>
              <input
                id="story-name"
                name="name"
                minLength={2}
                maxLength={80}
                required
                aria-describedby="story-name-help"
              />
              <p id="story-name-help" className="fine-print">
                Use the name you would like readers to see.
              </p>
            </div>
            <div className="field">
              <label htmlFor="story-email">Email address</label>
              <input
                id="story-email"
                name="email"
                type="email"
                maxLength={254}
                required
                autoComplete="email"
                aria-describedby="story-email-help"
              />
              <p id="story-email-help" className="fine-print">
                For follow-up only. Your email will stay private.
              </p>
            </div>
            <div className="field col-span-full">
              <label htmlFor="story-title">Story title</label>
              <input
                id="story-title"
                name="title"
                minLength={3}
                maxLength={120}
                required
              />
            </div>
            <div className="field col-span-full">
              <label htmlFor="story-text">Your story</label>
              <textarea
                id="story-text"
                name="story"
                minLength={30}
                maxLength={5000}
                rows={7}
                required
                aria-describedby="story-text-help"
              />
              <p id="story-text-help" className="fine-print">
                30–5,000 characters. Please leave out private details you would
                not want published.
              </p>
            </div>
          </div>
          <label className="my-5 flex items-start gap-3 text-sm">
            <input className="mt-1" type="checkbox" name="consent" required />
            <span>
              I wrote this story and give Iya Yusuf’s Pantry permission to
              publish it with my display name after review. I understand that
              submission does not guarantee publication.
            </span>
          </label>
          <Button type="submit" disabled={busy || !enabled}>
            {busy ? "Sending…" : "Send story for review"}
          </Button>
        </fieldset>
        <p className="fine-print mt-4">
          To request a correction or removal,{" "}
          <Link className="underline" href="/contact">
            contact us
          </Link>
          . Read our{" "}
          <Link className="underline" href="/privacy">
            privacy policy
          </Link>
          .
        </p>
        <p role={failed ? "alert" : "status"} className="mt-4">
          {status}
        </p>
      </form>
    </section>
  );
}
