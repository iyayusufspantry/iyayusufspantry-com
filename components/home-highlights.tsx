"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sprout,
} from "lucide-react";
import type { BrandPhoto } from "@/data/brand-assets";
import { MockImage } from "@/components/catalog";

export type HomeHighlight = {
  title: string;
  description: string;
  href: string;
  action: string;
  photo?: BrandPhoto;
};
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function HomeHighlights({ slides }: { slides: HomeHighlight[] }) {
  const [index, setIndex] = useState(0);
  const [playback, setPlayback] = useState<boolean | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );
  const paused = useRef(false);
  const visible = useRef(true);
  const root = useRef<HTMLElement>(null);
  const playing = playback ?? !reducedMotion;
  const slide = slides[index];
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && visible.current && !paused.current)
        setIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [playing, slides.length]);
  function select(next: number) {
    setIndex((next + slides.length) % slides.length);
    setPlayback(false);
  }
  if (!slide) return null;
  return (
    <section
      ref={root}
      className="home-highlights"
      role="region"
      aria-roledescription="carousel"
      aria-label="Pantry highlights"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") paused.current = true;
      }}
      onPointerLeave={() => {
        paused.current = false;
      }}
      onFocusCapture={(event) => {
        if (!event.target.closest("[data-highlight-playback]"))
          setPlayback(false);
      }}
    >
      <div className="highlight-visual" aria-hidden="true">
        {slide.photo ? (
          <MockImage photo={{ ...slide.photo, alt: "" }} kind="article" />
        ) : (
          <Sprout size={64} strokeWidth={1.1} />
        )}
      </div>
      <div
        className="highlight-copy"
        aria-live={playing ? "off" : "polite"}
        aria-atomic="true"
      >
        <span className="eyebrow">Discover more from the pantry</span>
        <h2>{slide.title}</h2>
        <p>{slide.description}</p>
        <Link className="text-link" href={slide.href}>
          {slide.action} <ArrowRight size={16} />
        </Link>
      </div>
      <div className="highlight-controls">
        <button
          type="button"
          onClick={() => select(index - 1)}
          aria-label="Previous highlight"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="highlight-position" aria-live="off">
          {index + 1} / {slides.length}
        </span>
        <button
          type="button"
          onClick={() => select(index + 1)}
          aria-label="Next highlight"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          data-highlight-playback
          onClick={() => setPlayback(!playing)}
          aria-label={playing ? "Pause highlights" : "Play highlights"}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
          <span>{playing ? "Pause" : "Play"}</span>
        </button>
      </div>
    </section>
  );
}
