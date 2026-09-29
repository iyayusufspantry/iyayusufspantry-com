"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { BrandPhoto } from "@/data/brand-assets";
import { MockImage } from "@/components/catalog";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function ProductGallery({
  photos,
  labels,
  productName,
  viewImageLabel,
}: {
  photos: BrandPhoto[];
  labels: string[];
  productName: string;
  viewImageLabel: string;
}) {
  const [image, setImage] = useState(0);
  const [playback, setPlayback] = useState<boolean | null>(null);
  const hovered = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );
  const playing = playback ?? !reducedMotion;
  const canRotate = photos.length > 1;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canRotate || !playing) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && visible.current && !hovered.current)
        setImage((current) => (current + 1) % photos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [canRotate, playing, photos.length]);

  function select(next: number) {
    setImage((next + labels.length) % labels.length);
    setPlayback(false);
  }

  return (
    <div
      ref={root}
      className="product-gallery"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${productName} photos`}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
      onFocusCapture={(event) => {
        if (!event.target.closest("[data-gallery-playback]"))
          setPlayback(false);
      }}
    >
      {canRotate && (
        <div className="gallery-controls">
          <button
            type="button"
            data-gallery-playback
            onClick={() => setPlayback(!playing)}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
            <span>{playing ? "Pause" : "Play"}</span>
          </button>
          <span className="gallery-position" aria-live="off">
            {image + 1} / {photos.length}
          </span>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => select(image - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => select(image + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      <div aria-live={playing ? "off" : "polite"} aria-atomic="true">
        <MockImage
          label={labels[image]}
          photo={photos[image]}
          className="product-main-image"
          index={image}
        />
      </div>
      {labels.length > 1 && (
        <div className="gallery-thumbnails">
          {labels.map((label, index) => (
            <button
              type="button"
              key={index}
              onClick={() => select(index)}
              aria-label={viewImageLabel.replaceAll("{0}", label.toLowerCase())}
              aria-pressed={image === index}
            >
              <MockImage label={label} index={index} photo={photos[index]} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
