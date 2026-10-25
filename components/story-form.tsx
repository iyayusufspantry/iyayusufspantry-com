"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MessageSquareText, PenLine, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

function subscribeToShareLink(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}
function setSharing(open: boolean) {
  const url = new URL(window.location.href);
  url.hash = open ? "share-story" : "";
  window.history.replaceState(
    window.history.state,
    "",
    url.pathname + url.search + url.hash,
  );
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
const emptyDraft = {
  name: "",
  email: "",
  title: "",
  story: "",
  consent: false,
};

export function StoryShareButton() {
  return (
    <Button
      className="mt-6"
      data-story-share
      aria-haspopup="dialog"
      onClick={(event) => {
        event.currentTarget.focus();
        setSharing(true);
      }}
    >
      <PenLine aria-hidden="true" />
      Share your story
    </Button>
  );
}

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
  const open = useSyncExternalStore(
    subscribeToShareLink,
    () => window.location.hash === "#share-story",
    () => false,
  );
  const title = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const resultMessage = useRef<HTMLParagraphElement>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);
  useEffect(() => {
    if (status) resultMessage.current?.focus();
  }, [status]);
  return (
    <Dialog open={open} onOpenChange={setSharing}>
      <aside
        className="story-contribute"
        aria-labelledby="story-contribute-title"
      >
        <span className="story-contribute-icon">
          <MessageSquareText size={24} aria-hidden="true" />
        </span>
        <span className="eyebrow">Your place at the table</span>
        <h2 id="story-contribute-title">Every kitchen has a story.</h2>
        <p>
          A childhood snack. A family recipe. A meal that brings you home. We’d
          love to hear yours.
        </p>
        <DialogTrigger asChild>
          <Button
            className="w-full"
            onClick={(event) => event.currentTarget.focus()}
          >
            <PenLine aria-hidden="true" />
            Share your story
          </Button>
        </DialogTrigger>
        <p className="story-contribute-note">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Simbiat reviews every story. Your email stays private.</span>
        </p>
      </aside>
      <DialogContent
        className="story-composer-dialog flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current =
            document.activeElement instanceof HTMLElement &&
            document.activeElement !== document.body
              ? document.activeElement
              : document.querySelector("[data-story-share]");
          title.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus({ preventScroll: true });
        }}
      >
        <DialogHeader className="border-b px-6 pb-5 pt-7 pr-16 sm:px-8 sm:pr-16">
          <span className="eyebrow">Your place at the table</span>
          <DialogTitle
            ref={title}
            tabIndex={-1}
            className="text-3xl font-normal outline-none"
          >
            Share your story
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Tell us about the food, people, and traditions that bring you home.
            Simbiat will review your story before it is published.
          </DialogDescription>
        </DialogHeader>
        <div className="story-composer-scroll min-h-0 overflow-y-auto px-6 py-6 sm:px-8">
          <form
            className="story-submission-form"
            aria-busy={busy}
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
                setDraft(emptyDraft);
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
                <div className="story-field">
                  <label htmlFor="story-name">Display name</label>
                  <Input
                    id="story-name"
                    className="h-11 rounded-lg bg-white"
                    name="name"
                    autoComplete="nickname"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                    minLength={2}
                    maxLength={80}
                    required
                    aria-describedby="story-name-help"
                  />
                  <p id="story-name-help" className="fine-print">
                    Use the name you would like readers to see.
                  </p>
                </div>
                <div className="story-field">
                  <label htmlFor="story-email">Email address</label>
                  <Input
                    id="story-email"
                    className="h-11 rounded-lg bg-white"
                    name="email"
                    value={draft.email}
                    onChange={(event) =>
                      setDraft({ ...draft, email: event.target.value })
                    }
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
                <div className="story-field col-span-full">
                  <label htmlFor="story-title">Story title</label>
                  <Input
                    id="story-title"
                    className="h-11 rounded-lg bg-white"
                    name="title"
                    placeholder="Give your memory a title"
                    value={draft.title}
                    onChange={(event) =>
                      setDraft({ ...draft, title: event.target.value })
                    }
                    minLength={3}
                    maxLength={120}
                    required
                  />
                </div>
                <div className="story-field col-span-full">
                  <label htmlFor="story-text">Your story</label>
                  <Textarea
                    id="story-text"
                    className="rounded-lg bg-white"
                    name="story"
                    placeholder="It all started in the kitchen…"
                    value={draft.story}
                    onChange={(event) =>
                      setDraft({ ...draft, story: event.target.value })
                    }
                    minLength={30}
                    maxLength={5000}
                    rows={6}
                    required
                    aria-describedby="story-text-help"
                  />
                  <p id="story-text-help" className="fine-print">
                    30–5,000 characters. Please leave out private details you
                    would not want published.
                  </p>
                </div>
              </div>
              <label className="my-5 flex items-start gap-3 text-sm">
                <input
                  className="mt-1 shrink-0"
                  type="checkbox"
                  name="consent"
                  required
                  checked={draft.consent}
                  onChange={(event) =>
                    setDraft({ ...draft, consent: event.target.checked })
                  }
                />
                <span>
                  I wrote this story and give Iya Yusuf’s Pantry permission to
                  publish it with my display name after review. I understand
                  that submission does not guarantee publication.
                </span>
              </label>
              <Button
                className="w-full sm:w-auto"
                type="submit"
                disabled={busy || !enabled}
              >
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
            <p
              ref={resultMessage}
              tabIndex={-1}
              role={failed ? "alert" : "status"}
              className={
                status ? "story-submission-status mt-4 outline-none" : undefined
              }
              data-failed={failed}
            >
              {status}
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
