"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CommunityStory = {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  sections: { heading?: string; text: string }[];
  href?: string;
};
const pageSize = 6;

export function CommunityStories({ stories }: { stories: CommunityStory[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const filtered = stories.filter((story) =>
    `${story.title} ${story.author}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const pages = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(0, pages - 1));
  return (
    <section className="community-stories" aria-label="Community stories">
      <div className="story-search">
        <label htmlFor="story-search">Find a story</label>
        <input
          id="story-search"
          type="search"
          placeholder="Search by title or name"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />
        <p role="status">
          {filtered.length} {filtered.length === 1 ? "story" : "stories"}
        </p>
      </div>
      {!filtered.length && (
        <p className="notice">
          No stories match your search. Try another title or name.
        </p>
      )}
      <div className="community-story-grid">
        {filtered
          .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
          .map((story) => (
            <article key={story.id} className="community-story-card">
              <h2>{story.title}</h2>
              {story.author && (
                <p className="eyebrow normal-case">By {story.author}</p>
              )}
              <p className="community-story-excerpt">{story.excerpt}</p>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button
                    type="button"
                    className="text-link"
                    aria-label={`Read story: ${story.title}`}
                  >
                    Read story <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="dialog-overlay" />
                  <Dialog.Content
                    className="dialog-content community-story-dialog"
                    aria-describedby={undefined}
                  >
                    <div className="dialog-heading">
                      <Dialog.Title>{story.title}</Dialog.Title>
                      {story.author && <p>By {story.author}</p>}
                    </div>
                    <div
                      className="dialog-scroll article-body"
                      tabIndex={0}
                      aria-label="Story text"
                    >
                      {story.sections.map((section, index) => (
                        <section key={index}>
                          {section.heading && <h3>{section.heading}</h3>}
                          <p className="whitespace-pre-wrap">{section.text}</p>
                        </section>
                      ))}
                      {story.href && (
                        <Link href={story.href} className="text-link">
                          Open story page{" "}
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                    <Dialog.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="dialog-close"
                        aria-label="Close story"
                      >
                        <X size={20} />
                      </Button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </article>
          ))}
      </div>
      {pages > 1 && (
        <nav className="story-pagination" aria-label="Story pages">
          <Button
            variant="outline"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous stories
          </Button>
          <span role="status">
            Page {currentPage + 1} of {pages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage + 1 >= pages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next stories
          </Button>
        </nav>
      )}
    </section>
  );
}
