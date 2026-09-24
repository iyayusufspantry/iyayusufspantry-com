"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import type { Quote } from "@/lib/commerce/catalog";
import { money } from "@/data/products";

type Stock = {
  variant_id: string;
  name: string;
  on_hand: number;
  reserved: number;
  initialized: boolean;
};
type Count = { status: string; count: number };
type Overview = {
  orders: {
    id: string;
    status: string;
    quote: Quote;
    created_at: string;
    fulfilled_at: string | null;
    customer_details: { email?: string; name?: string } | null;
    shipping_details: {
      name?: string;
      address?: Record<string, string | null>;
    } | null;
  }[];
  stock: Stock[];
  counts: Count[];
  subscribers: Count[];
  mail: Count[];
  messages: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    handled_at: string | null;
  }[];
};
export function OwnerDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const response = await fetch(`/api/owner?page=${page}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not load the dashboard.");
    }
    return result as Overview;
  }, [page]);
  useEffect(() => {
    let active = true;
    refresh()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) {
          setData(null);
          setError(e.message);
        }
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  async function save(body: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not save the change.");
      setData(await refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="site-container page-bottom py-12">
      <h1>Owner dashboard</h1>
      <p className="notice my-6">
        Orders and stock below are saved sandbox records. Contact messages and
        newsletter preferences are real submissions when those forms are
        enabled. Sandbox fulfillment does not ship goods.
      </p>
      <Button
        variant="outline"
        disabled={busy}
        onClick={() =>
          refresh()
            .then(setData)
            .catch((e) => {
              setData(null);
              setError(e.message);
            })
        }
      >
        Refresh dashboard
      </Button>
      {error && (
        <p role="alert" className="notice my-4">
          {error}
        </p>
      )}
      {!data ? (
        <p className="my-8">
          {error ? "Dashboard unavailable." : "Loading your dashboard…"}
        </p>
      ) : (
        <>
          <section className="my-10">
            <h2>Test orders</h2>
            <p className="my-4">
              {data.counts.map((c) => `${c.count} ${c.status}`).join(" · ") ||
                "No orders yet."}
            </p>
            <div className="grid gap-4">
              {data.orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-xl border border-border p-5"
                >
                  <h3 className="break-all">Order {order.id.slice(0, 8)}</h3>
                  <p>
                    {order.status} · {money(order.quote.subtotalCents / 100)} ·{" "}
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                  <ul className="my-3">
                    {order.quote.lines.map((line) => (
                      <li key={line.variantId}>
                        {line.productSlug} × {line.quantity}
                      </li>
                    ))}
                  </ul>
                  <p>
                    {order.customer_details?.name}{" "}
                    {order.customer_details?.email}
                  </p>
                  {order.shipping_details && (
                    <p className="my-2">
                      {order.shipping_details.name}:{" "}
                      {Object.values(order.shipping_details.address || {})
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {order.fulfilled_at ? (
                    <p className="mt-3">Fulfilled in sandbox</p>
                  ) : (
                    order.status === "paid" && (
                      <Button
                        className="mt-3"
                        disabled={busy}
                        onClick={() =>
                          save({ action: "fulfill", id: order.id })
                        }
                      >
                        Mark test order fulfilled
                      </Button>
                    )
                  )}
                </article>
              ))}
            </div>
            <div className="my-5 flex gap-3">
              <Button
                variant="outline"
                disabled={page === 0 || busy}
                onClick={() => setPage(page - 1)}
              >
                Previous orders
              </Button>
              <Button
                variant="outline"
                disabled={data.orders.length < 25 || busy}
                onClick={() => setPage(page + 1)}
              >
                Next orders
              </Button>
            </div>
          </section>
          <section className="my-10">
            <h2>Sandbox stock</h2>
            <p className="my-3">
              Stock edits are saved. Reserved units cannot be removed.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {data.stock.map((stock) => (
                <form
                  key={`${stock.variant_id}:${stock.on_hand}:${stock.reserved}:${stock.initialized}`}
                  className="rounded-xl border border-border p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save({
                      action: "stock",
                      variant: stock.variant_id,
                      onHand: Number(
                        new FormData(e.currentTarget).get("onHand"),
                      ),
                      expected: stock.initialized
                        ? { onHand: stock.on_hand, reserved: stock.reserved }
                        : null,
                    });
                  }}
                >
                  <label className="block">
                    {stock.name}
                    <input
                      className="mt-2 block w-full rounded border border-border p-2"
                      aria-label={`Stock for ${stock.name}`}
                      type="number"
                      name="onHand"
                      defaultValue={stock.on_hand}
                      min={stock.reserved}
                      max={1000000}
                      required
                    />
                  </label>
                  <p className="my-2 text-sm">
                    {stock.reserved} reserved · {stock.on_hand - stock.reserved}{" "}
                    available
                    {stock.initialized ? "" : " · default sample stock"}
                  </p>
                  <Button type="submit" variant="outline" disabled={busy}>
                    Save stock
                  </Button>
                </form>
              ))}
            </div>
          </section>
          <section className="my-10">
            <h2>Contact inbox</h2>
            <p className="my-3">
              Latest 100 messages. Reply using your business email.
            </p>
            {data.messages.length === 0 && <p>No messages yet.</p>}
            {data.messages.map((message) => (
              <article
                key={message.id}
                className="my-4 rounded-xl border border-border p-5"
              >
                <h3>
                  {message.subject} · {message.name}
                </h3>
                <p className="break-all">{message.email}</p>
                <p className="my-4 whitespace-pre-wrap break-words">
                  {message.message}
                </p>
                {message.handled_at ? (
                  <p>Handled</p>
                ) : (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      save({ action: "handle-message", id: message.id })
                    }
                  >
                    Mark handled
                  </Button>
                )}
              </article>
            ))}
          </section>
          <section className="my-10">
            <h2>Newsletter and email delivery</h2>
            <a className="text-link mt-4" href="/api/owner/subscribers">
              Download confirmed subscribers (up to 10,000)
            </a>
            <p className="my-3">
              Subscriptions:{" "}
              {data.subscribers
                .map((c) => `${c.count} ${c.status}`)
                .join(" · ") || "none"}
            </p>
            <p>
              Email queue:{" "}
              {data.mail.map((c) => `${c.count} ${c.status}`).join(" · ") ||
                "empty"}
            </p>
            <p className="fine-print mt-3">
              Only confirmed subscribers may receive newsletters. Messages
              marked review need delivery reconciliation.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
