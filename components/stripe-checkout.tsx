"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useCart, useLoadDemoCart } from "./cart-provider";
import { useContent } from "./content-provider";
import { PageHeading } from "./catalog";
import { Button } from "./ui/button";
import { findVariant } from "@/lib/commerce/catalog";
import { selectCartSubtotal } from "@/lib/cart-store";
import { money } from "@/data/products";

export function StripeCheckout({ cancelled }: { cancelled: boolean }) {
  const { variants, products } = useContent();
  const items = useCart((state) => state.items);
  const ready = useCart((state) => state.ready);
  const subtotal = useCart(selectCartSubtotal);
  const loadDemo = useLoadDemoCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const request = useRef<{ fingerprint: string; id: string } | null>(null);

  async function checkout() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const selections = items
        .map((item) => ({
          variantId:
            findVariant(variants, item.slug, item.size, item.dietary)?.id ?? "",
          quantity: item.quantity,
        }))
        .sort((a, b) => a.variantId.localeCompare(b.variantId));
      const fingerprint = JSON.stringify(selections);
      // Reuse the request across reloads and uncertain network failures.
      if (!request.current) {
        try {
          request.current = JSON.parse(
            sessionStorage.getItem("simbiat-checkout-request") || "null",
          );
        } catch {
          /* Storage is optional. */
        }
      }
      if (request.current?.fingerprint !== fingerprint)
        request.current = { fingerprint, id: crypto.randomUUID() };
      try {
        sessionStorage.setItem(
          "simbiat-checkout-request",
          JSON.stringify(request.current),
        );
      } catch {
        /* In-memory retries still work. */
      }
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selections,
          requestId: request.current!.id,
        }),
        signal: AbortSignal.timeout(60000),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          request.current = null;
          try {
            sessionStorage.removeItem("simbiat-checkout-request");
          } catch {
            /* Storage is optional. */
          }
        }
        throw new Error(
          result.error || "Checkout is unavailable. Please try again.",
        );
      }
      const destination = new URL(result.url);
      if (
        destination.protocol !== "https:" ||
        destination.hostname !== "checkout.stripe.com"
      )
        throw new Error("Invalid checkout destination.");
      window.location.assign(destination.href);
    } catch (error) {
      setError(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "Checkout timed out. Please retry with the same bag.",
      );
      setBusy(false);
      inFlight.current = false;
    }
  }

  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow="Checkout"
        title="Try a test checkout"
        description="Complete a sandbox purchase with Stripe. No real money will be charged or goods shipped."
      />
      <p className="notice mb-7">
        Sandbox only · Sample inventory · Test shipping $0.00 · Test tax $0.00
      </p>
      {cancelled && (
        <p className="notice mb-7" role="status">
          You returned from Stripe. Your bag is still here. Continue to resume
          your payment; unpaid reservations are released when the session
          expires.
        </p>
      )}
      <div className="commerce-grid">
        <section className="checkout-section">
          <h2>
            <LockKeyhole size={24} /> Secure checkout with Stripe
          </h2>
          <p className="mt-4">
            Enter your email, US delivery address, and test card on Stripe’s
            payment page.
          </p>
          <p className="mt-4">
            For a successful test, use card <strong>4242 4242 4242 4242</strong>
            , any future expiry date, and any three-digit CVC. Use fictional
            contact and delivery details.
          </p>
          <p className="fine-print mt-4">
            Test orders and delivery details are saved so we can verify the
            checkout. Confirmation emails are not enabled yet.
          </p>
          {!items.length && ready && (
            <Button className="mt-6" variant="outline" onClick={loadDemo}>
              Load sample cart
            </Button>
          )}
          <Button
            className="mt-8 w-full"
            disabled={!ready || !items.length || busy}
            onClick={checkout}
          >
            {busy ? "Opening Stripe…" : "Continue to Stripe — test payment"}
            <ArrowRight />
          </Button>
          {error && (
            <p className="notice mt-4" role="alert">
              {error}
            </p>
          )}
          <Link className="text-link mt-6" href="/cart">
            Back to your bag
          </Link>
        </section>
        <aside className="order-summary">
          <h2>Your test order</h2>
          <div className="summary-items">
            {items.map((item) => {
              const variant = findVariant(
                variants,
                item.slug,
                item.size,
                item.dietary,
              );
              return (
                <div className="summary-item" key={item.key}>
                  <div className="flex-1">
                    <strong>
                      {products.find((p) => p.slug === item.slug)?.name ||
                        item.slug}
                    </strong>
                    <span>
                      {item.size} · Qty {item.quantity}
                    </span>
                  </div>
                  <span>
                    {money(((variant?.priceCents ?? 0) * item.quantity) / 100)}
                  </span>
                </div>
              );
            })}
          </div>
          <dl className="summary-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            <div>
              <dt>Test shipping</dt>
              <dd>$0.00</dd>
            </div>
            <div>
              <dt>Test tax</dt>
              <dd>$0.00</dd>
            </div>
            <div className="summary-total">
              <dt>Test total</dt>
              <dd>
                {money(subtotal)} <small>USD</small>
              </dd>
            </div>
          </dl>
          <p className="fine-print">
            Price and availability are checked again before Stripe opens.
          </p>
        </aside>
      </div>
    </div>
  );
}

type OrderStatus = {
  status: "pending" | "paid" | "cancelled" | "review";
  reference: string;
  totalCents: number;
};
export function StripeConfirmation({ sessionId }: { sessionId: string }) {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const abort = new AbortController();
    let count = 0;
    async function poll() {
      try {
        const response = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store", signal: abort.signal },
        );
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Could not load your order.");
        if (stopped) return;
        setOrder(result);
        setError("");
        if (result.status !== "pending") {
          try {
            sessionStorage.removeItem("simbiat-checkout-request");
          } catch {
            /* Storage is optional. */
          }
          return;
        }
      } catch (error) {
        if (stopped) return;
        setError(
          error instanceof Error ? error.message : "Could not load your order.",
        );
      }
      if (++count < 20) timer = setTimeout(poll, 2000);
      else
        setError(
          "Confirmation is taking longer than expected. Check again shortly; you do not need to pay again.",
        );
    }
    void poll();
    return () => {
      stopped = true;
      abort.abort();
      clearTimeout(timer);
    };
  }, [sessionId, attempt]);
  const title =
    order?.status === "paid"
      ? "Test payment confirmed"
      : order?.status === "cancelled"
        ? "Test checkout ended"
        : order?.status === "review"
          ? "Test payment needs review"
          : "Confirming your test payment";
  return (
    <div className="confirmation-page site-container">
      <span className="eyebrow">Stripe sandbox</span>
      <h1>{title}</h1>
      <div className="notice mt-6" role="status">
        {order?.status === "paid"
          ? "Your test order is saved and sample stock has been updated. No real money was charged."
          : order?.status === "cancelled"
            ? "This checkout expired or its payment failed. The reserved stock has been released."
            : order?.status === "review"
              ? "Payment arrived after the reservation ended. This order needs manual review before fulfillment."
              : "Waiting for verified payment confirmation from Stripe. Please keep this page open."}
      </div>
      {order && (
        <section className="confirmation-card">
          <p>Order reference: {order.reference}</p>
          <p className="mt-4">
            Test total: <strong>{money(order.totalCents / 100)} USD</strong>
          </p>
        </section>
      )}
      {error && (
        <p className="notice mt-4" role="alert">
          {error}
        </p>
      )}
      {error && (
        <Button
          className="mt-4"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Check again
        </Button>
      )}
      <p className="fine-print mt-6">
        This is a sandbox order. No goods will be shipped and no confirmation
        email is sent.
      </p>
      <Link className="text-link mt-6" href="/shop">
        Continue shopping <ArrowRight size={16} />
      </Link>
    </div>
  );
}
