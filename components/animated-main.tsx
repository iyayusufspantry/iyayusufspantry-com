"use client";

import { animate } from "motion/mini";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

// Shared layout patterns keep new pages and asynchronously loaded cards covered.
// Only leaf matches animate, so a section and its cards never move together.
const revealSelector = [
  ".site-container > *",
  "section",
  ".home-hero > *",
  ".values-strip > *",
  ".section-heading",
  ".category-card",
  ".product-card",
  ".editorial-card",
  ".pantry-photo-grid > *",
  ".story-section > *",
  ".about-hero > *",
  ".about-values > *",
  ".article-body > *",
  ".recipe-body > *",
  ".product-detail-grid > *",
  ".product-info-grid > *",
  ".contact-grid > *",
  ".faq-section > *",
  ".newsletter > *",
  ".cart-item",
  ".scope-hero > *",
  ".scope-section-title",
  ".scope-feature",
  ".directory-card",
  ".owner-stats > *",
  ".owner-section-heading",
  ".owner-order-card",
  ".owner-stock-row",
].join(", ");

export function AnimatedMain({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const container = root.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const print = window.matchMedia("print");
    let dispose = () => {};

    function setup() {
      dispose();
      if (reducedMotion.matches || print.matches || !container) return;

      const seen = new WeakSet<HTMLElement>();
      const active = new Map<HTMLElement, () => void>();
      const distance = window.matchMedia("(max-width: 767px)").matches
        ? 14
        : 22;
      let frame = 0;

      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          observer.unobserve(element);

          // Never animate a control the visitor has already started using.
          if (element.contains(document.activeElement)) continue;
          const siblings = Array.from(element.parentElement?.children ?? []);
          const index = siblings
            .filter((sibling) => sibling.matches(revealSelector))
            .indexOf(element);
          const originalOpacity = element.style.opacity;
          const originalTranslate = element.style.translate;
          const restore = () => {
            element.style.opacity = originalOpacity;
            element.style.translate = originalTranslate;
            active.delete(element);
          };

          // Content stays visible until it enters view: no hidden SSR content,
          // blank full-page screenshots, or JavaScript-dependent reading.
          const animation = animate(
            element,
            { opacity: [0, 1], translate: [`0 ${distance}px`, "0 0"] },
            {
              duration: 0.6,
              delay: Math.min(Math.max(index, 0), 3) * 0.06,
              ease: [0.22, 1, 0.36, 1],
            },
          );
          active.set(element, () => {
            animation.cancel();
            restore();
          });
          void animation.then(restore);
        }
      });

      function scan() {
        frame = 0;
        for (const [element, cancel] of active) {
          if (!container?.contains(element)) cancel();
        }
        container
          ?.querySelectorAll<HTMLElement>(revealSelector)
          .forEach((element) => {
            if (seen.has(element) || element.querySelector(revealSelector))
              return;
            const position = getComputedStyle(element).position;
            if (position === "sticky" || position === "fixed") return;
            seen.add(element);
            observer.observe(element);
          });
      }

      // Streamed server content, cart hydration, and filtered results can arrive
      // after the layout effect. Batch discovery without watching style changes.
      const mutations = new MutationObserver(() => {
        if (!frame) frame = requestAnimationFrame(scan);
      });
      mutations.observe(container, { childList: true, subtree: true });
      scan();

      const onFocus = (event: FocusEvent) => {
        for (const [element, cancel] of active) {
          if (event.target instanceof Node && element.contains(event.target))
            cancel();
        }
      };
      container.addEventListener("focusin", onFocus);
      dispose = () => {
        cancelAnimationFrame(frame);
        mutations.disconnect();
        observer.disconnect();
        container.removeEventListener("focusin", onFocus);
        for (const cancel of active.values()) cancel();
      };
    }

    setup();
    reducedMotion.addEventListener("change", setup);
    print.addEventListener("change", setup);
    return () => {
      dispose();
      reducedMotion.removeEventListener("change", setup);
      print.removeEventListener("change", setup);
    };
  }, [pathname]);

  return (
    <main ref={root} id="main-content" tabIndex={-1}>
      {children}
    </main>
  );
}
