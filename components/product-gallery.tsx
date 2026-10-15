"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import type { CSSProperties } from "react";
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
  const [enlarged, setEnlarged] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
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
    if (!canRotate || !playing || enlarged) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && visible.current && !hovered.current)
        setImage((current) => (current + 1) % photos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [canRotate, playing, photos.length, enlarged]);

  function select(next: number) {
    setImage((next + labels.length) % labels.length);
    setPlayback(false);
    setZoom(1);
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
        <Dialog.Root
          open={enlarged}
          onOpenChange={(open) => {
            setEnlarged(open);
            if (open) {
              setPlayback(false);
              setZoom(1);
            }
          }}
        >
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="product-photo-trigger"
              aria-label={`Enlarge ${productName} photo`}
              disabled={!photos[image]}
              style={
                {
                  "--zoom-x": `${pointer.x}%`,
                  "--zoom-y": `${pointer.y}%`,
                } as CSSProperties
              }
              onPointerMove={(event) => {
                if (event.pointerType !== "mouse") return;
                const rect = event.currentTarget.getBoundingClientRect();
                setPointer({
                  x: (100 * (event.clientX - rect.left)) / rect.width,
                  y: (100 * (event.clientY - rect.top)) / rect.height,
                });
              }}
            >
              <MockImage
                label={labels[image]}
                photo={photos[image]}
                className="product-main-image"
                index={image}
              />
              {photos[image] && (
                <span className="photo-enlarge-label">
                  <ZoomIn size={18} /> Enlarge photo
                </span>
              )}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="photo-viewer-overlay" />
            <Dialog.Content
              className="photo-viewer"
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" && canRotate) {
                  event.preventDefault();
                  select(image + 1);
                }
                if (event.key === "ArrowLeft" && canRotate) {
                  event.preventDefault();
                  select(image - 1);
                }
              }}
            >
              <Dialog.Title>{productName}</Dialog.Title>
              <Dialog.Description>
                Use the zoom controls for a closer look. Scroll to move around
                an enlarged photo.
              </Dialog.Description>
              <div className="photo-viewer-controls">
                {canRotate && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous enlarged photo"
                      onClick={() => select(image - 1)}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span>
                      {image + 1} / {photos.length}
                    </span>
                    <button
                      type="button"
                      aria-label="Next enlarged photo"
                      onClick={() => select(image + 1)}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  aria-label="Zoom out"
                  disabled={zoom === 1}
                  onClick={() =>
                    setZoom((current) => Math.max(1, current - 0.5))
                  }
                >
                  <ZoomOut size={18} />
                </button>
                <output aria-live="polite">{Math.round(zoom * 100)}%</output>
                <button
                  type="button"
                  aria-label="Zoom in"
                  disabled={zoom === 3}
                  onClick={() =>
                    setZoom((current) => Math.min(3, current + 0.5))
                  }
                >
                  <ZoomIn size={18} />
                </button>
                <button type="button" onClick={() => setZoom(1)}>
                  Reset zoom
                </button>
              </div>
              <div
                className="photo-viewer-stage"
                tabIndex={0}
                role="region"
                aria-label="Enlarged product photo"
                style={{ "--image-zoom": zoom } as CSSProperties}
              >
                <div className="photo-viewer-image">
                  {photos[image] && (
                    <Image
                      src={photos[image].src}
                      alt={photos[image].alt}
                      fill
                      sizes="100vw"
                      style={{ objectFit: "contain" }}
                    />
                  )}
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="photo-viewer-close"
                  aria-label="Close enlarged photo"
                >
                  <X size={22} />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
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
