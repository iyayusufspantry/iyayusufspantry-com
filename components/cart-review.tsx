"use client";
import { useContent } from "@/components/content-provider";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { money } from "@/data/products";
import { findVariant } from "@/lib/commerce/catalog";
import type { CartItem } from "@/lib/cart-store";

export function CartReview({ items }: { items: CartItem[] }) {
  const { variants } = useContent();

  const { copy: allCopy } = useContent();
  const copy = allCopy["components/cart-review.tsx"];

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  async function review() {
    setStatus("loading");
    setMessage(copy["copy-1"]);
    try {
      const response = await fetch("/api/cart/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId:
              findVariant(variants, item.slug, item.size, item.dietary)?.id ??
              "",
            quantity: item.quantity,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? copy["copy-3"]);
      setMessage(
        copy["template-1"].replaceAll(
          "{0}",
          String(money(result.subtotalCents / 100)),
        ),
      );
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : copy["copy-5"],
      );
    }
  }
  return (
    <div className="cart-review">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!items.length || status === "loading"}
        onClick={review}
      >
        {status === "loading" ? copy["copy-6"] : copy["copy-7"]}
      </Button>
      <p className="fine-print mt-3"> {copy["copy-8"]} </p>
      <p
        className="fine-print mt-3"
        role="status"
        aria-live="polite"
        data-review-status={status}
      >
        {message}
      </p>
    </div>
  );
}
