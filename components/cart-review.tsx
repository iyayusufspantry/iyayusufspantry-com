"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { money } from "@/data/products";
import { findVariant } from "@/lib/commerce/catalog";
import type { CartItem } from "@/lib/cart-store";

export function CartReview({ items }: { items: CartItem[] }) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  async function review() {
    setStatus("loading");
    setMessage("Checking sample prices and availability…");
    try {
      const response = await fetch("/api/cart/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId:
              findVariant(item.slug, item.size, item.dietary)?.id ?? "",
            quantity: item.quantity,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Unable to review your bag.");
      setMessage(
        `Sample items checked. Subtotal: ${money(result.subtotalCents / 100)}. Shipping and tax still need confirmation. No stock reserved or payment taken.`,
      );
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "The review timed out. Please try again.",
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
        {status === "loading"
          ? "Checking your bag…"
          : "Check sample availability"}
      </Button>
      <p className="fine-print mt-3">
        Check current sample prices and quantities before continuing.
      </p>
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
