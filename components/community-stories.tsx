"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Clock, Quote, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BrandPhoto } from "@/data/brand-assets";
import Image from "next/image";

export type CommunityStory = {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  sections: { heading?: string; text: string }[];
  href?: string;
  photo?: BrandPhoto;
  readTime?: string;
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
      <div className="stories-collection-heading">
        <div>
          <h2>Around the table</h2>
          <p role="status">
            {filtered.length} {filtered.length === 1 ? "story" : "stories"} to
            settle into
          </p>
        </div>
        <div className="story-search">
          <label className="sr-only" htmlFor="story-search">
            Find a story
          </label>
          <Search size={17} aria-hidden="true" />
          <Input
            id="story-search"
            className="h-11 rounded-lg bg-white pl-10"
            type="search"
            placeholder="Find a story or author"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>
      {!filtered.length && (
        <div className="stories-no-results">
          <BookOpen size={28} aria-hidden="true" />
          <p>No stories match your search. Try another title or name.</p>
          <Button variant="outline" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      )}
      <div className="community-story-grid">
        {filtered
          .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
          .map((story, index) => (
            <article
              key={story.id}
              className="community-story-card"
              data-featured={currentPage === 0 && index === 0}
              data-has-photo={Boolean(story.photo)}
            >
              {story.photo && (
                <div className="community-story-photo">
                  <Image
                    src={story.photo.src}
                    alt={story.photo.alt}
                    fill
                    preload={currentPage === 0 && index === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 440px"
                  />
                </div>
              )}
              <div className="community-story-preview">
                <div className="community-story-kicker">
                  <span className="eyebrow">
                    {index === 0 && currentPage === 0
                      ? "From our community"
                      : "A pantry memory"}
                  </span>
                  {!story.photo && <Quote size={24} aria-hidden="true" />}
                </div>
                <h2>{story.title}</h2>
                <div className="community-story-byline">
                  {story.author && <span>By {story.author}</span>}
                  {story.readTime && (
                    <span>
                      <Clock size={14} aria-hidden="true" />
                      {story.readTime}
                    </span>
                  )}
                </div>
                <p className="community-story-excerpt">{story.excerpt}</p>
                <Dialog.Root>
                  <Dialog.Trigger asChild>
                    <Button
                      variant="ghost"
                      className="text-link -ml-3 px-3"
                      aria-label={`Read story: ${story.title}`}
                    >
                      Read story <ArrowRight size={16} aria-hidden="true" />
                    </Button>
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
                            <p className="whitespace-pre-wrap">
                              {section.text}
                            </p>
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
              </div>
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
