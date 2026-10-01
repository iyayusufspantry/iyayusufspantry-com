"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Inbox,
  Info,
  Mail,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { Button } from "./ui/button";
import { useContent } from "./content-provider";
import type { Quote } from "@/lib/commerce/catalog";
import { money } from "@/data/products";
import styles from "./owner-dashboard.module.css";

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

const sections = [
  { id: "orders", label: "Test orders", icon: ShoppingBag },
  { id: "stock", label: "Sandbox stock", icon: Package },
  { id: "inbox", label: "Contact inbox", icon: Inbox },
  { id: "email", label: "Newsletter & email", icon: Mail },
] as const;
type Section = (typeof sections)[number]["id"];

function StatusBadge({ status }: { status: string }) {
  const tone = ["paid", "fulfilled", "confirmed", "sent", "handled"].includes(
    status,
  )
    ? "success"
    : ["pending", "queued", "review"].includes(status)
      ? "pending"
      : ["failed", "bounced"].includes(status)
        ? "error"
        : "neutral";
  return (
    <span className={styles.badge} data-tone={tone}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function CountList({ counts, empty }: { counts: Count[]; empty: string }) {
  return counts.length ? (
    <dl className={styles.countList}>
      {counts.map(({ status, count }) => (
        <div key={status}>
          <dt>
            <StatusBadge status={status} />
          </dt>
          <dd>{count.toLocaleString()}</dd>
        </div>
      ))}
    </dl>
  ) : (
    <p className={styles.empty}>{empty}</p>
  );
}

export function OwnerDashboard() {
  const { products } = useContent();
  const [data, setData] = useState<Overview | null>(null);
  const [page, setPage] = useState(0);
  const [section, setSection] = useState<Section>("orders");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const busy = loading || pendingAction !== null;
  const refresh = useCallback(async () => {
    const response = await fetch(`/api/owner?page=${page}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Could not load the dashboard.");
    return result as Overview;
  }, [page]);

  useEffect(() => {
    let active = true;
    refresh()
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  async function reload() {
    if (busy) return;
    setLoading(true);
    setError("");
    setFeedback("");
    try {
      setData(await refresh());
      setFeedback("Dashboard refreshed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function save(
    body: Record<string, unknown>,
    key: string,
    success: string,
  ) {
    if (busy) return;
    setPendingAction(key);
    setError("");
    setFeedback("");
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
      setFeedback(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  function changePage(next: number) {
    setLoading(true);
    setData(null);
    setError("");
    setFeedback("");
    setExpandedOrder(null);
    setPage(next);
  }

  const totalOrders =
    data?.counts.reduce((sum, count) => sum + count.count, 0) ?? 0;
  const paidOrders =
    data?.counts.find((count) => count.status === "paid")?.count ?? 0;
  const availableStock =
    data?.stock.reduce(
      (sum, stock) => sum + stock.on_hand - stock.reserved,
      0,
    ) ?? 0;
  const unreadMessages =
    data?.messages.filter((message) => !message.handled_at).length ?? 0;
  const metrics = [
    {
      label: "Total test orders",
      value: totalOrders,
      detail: "Across all order statuses",
      icon: ShoppingBag,
    },
    {
      label: "Paid test orders",
      value: paidOrders,
      detail: "Sandbox payments",
      icon: Check,
    },
    {
      label: "Available stock",
      value: availableStock,
      detail: `${data?.stock.length ?? 0} product variants`,
      icon: Package,
    },
    {
      label: "Unhandled messages",
      value: unreadMessages,
      detail: "In the latest 100 messages",
      icon: Inbox,
    },
  ];
  const productName = (slug: string) =>
    products.find((product) => product.slug === slug)?.name ||
    slug.replaceAll("-", " ");

  return (
    <div className={`site-container page-bottom ${styles.dashboard}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>YOUR PANTRY, AT A GLANCE</p>
          <h1>Owner dashboard</h1>
          <p className={styles.subtitle}>
            Manage orders, keep stock up to date, and stay in touch.
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={reload}>
          <RefreshCw
            aria-hidden="true"
            className={loading ? styles.spinning : undefined}
          />
          {loading ? "Refreshing…" : "Refresh dashboard"}
        </Button>
      </header>
      <aside className={styles.notice} aria-label="Sandbox information">
        <Info size={18} aria-hidden="true" />
        <p>
          <strong>Sandbox workspace.</strong> Orders and stock are saved test
          records; fulfillment does not ship goods. Contact messages and
          newsletter preferences are real submissions when enabled.
        </p>
      </aside>
      <div className={styles.feedback}>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <p role="status">{feedback}</p>
      </div>
      <div className={styles.metrics} aria-label="Dashboard overview">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className={styles.metric}>
            <div className={styles.metricHeading}>
              <span>{label}</span>
              <Icon size={18} aria-hidden="true" />
            </div>
            <strong>{data ? value.toLocaleString() : "—"}</strong>
            <p>{data ? detail : "Waiting for dashboard data"}</p>
          </article>
        ))}
      </div>
      <nav className={styles.navigation} aria-label="Dashboard sections">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={section === id}
            aria-controls="dashboard-section"
            onClick={() => setSection(id)}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
            {id === "inbox" && unreadMessages > 0 && (
              <span className={styles.navCount}>{unreadMessages}</span>
            )}
          </button>
        ))}
      </nav>
      <section
        id="dashboard-section"
        className={styles.panel}
        aria-labelledby="dashboard-section-title"
        aria-busy={busy}
      >
        <div className={styles.panelHeading}>
          <div>
            <h2 id="dashboard-section-title">
              {sections.find((item) => item.id === section)?.label}
            </h2>
            <p>
              {section === "orders"
                ? "Review your recent orders and manage test fulfillment."
                : section === "stock"
                  ? "Update stock quantities. Reserved units cannot be removed."
                  : section === "inbox"
                    ? "Latest 100 messages. Reply using your business email."
                    : "Manage subscriptions and monitor email delivery."}
            </p>
          </div>
          <span className={styles.sectionTag}>
            {section === "orders" || section === "stock"
              ? "SANDBOX"
              : "COMMUNICATIONS"}
          </span>
        </div>
        {!data ? (
          <div className={styles.empty} role="status">
            {error
              ? "Dashboard unavailable. Use Refresh dashboard to try again."
              : "Loading your dashboard…"}
          </div>
        ) : section === "orders" ? (
          <>
            <div className={styles.orderSummary}>
              <span>{totalOrders.toLocaleString()} orders</span>
              {data.counts.map(({ status, count }) => (
                <span key={status}>
                  <StatusBadge status={status} /> {count.toLocaleString()}
                </span>
              ))}
            </div>
            {data.orders.length === 0 ? (
              <div className={styles.empty}>
                <ShoppingBag aria-hidden="true" />
                <h3>No test orders yet</h3>
                <p>Your sandbox orders will appear here.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.orders}>
                  <caption className="sr-only">
                    Test orders, page {page + 1}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Order</th>
                      <th scope="col" className={styles.customerColumn}>
                        Customer
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col" className={styles.amount}>
                        Total
                      </th>
                      <th scope="col" className={styles.dateColumn}>
                        Created
                      </th>
                      <th scope="col">
                        <span className="sr-only">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((order) => {
                      const expanded = expandedOrder === order.id;
                      const itemCount = order.quote.lines.reduce(
                        (sum, line) => sum + line.quantity,
                        0,
                      );
                      return (
                        <Fragment key={order.id}>
                          <tr>
                            <td>
                              <strong className={styles.orderId}>
                                #{order.id.slice(0, 8)}
                              </strong>
                              <span className={styles.secondary}>
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                              </span>
                            </td>
                            <td className={styles.customerColumn}>
                              <span className={styles.customerName}>
                                {order.customer_details?.name ||
                                  "Test customer"}
                              </span>
                              <span className={styles.secondary}>
                                {order.customer_details?.email ||
                                  "No email provided"}
                              </span>
                            </td>
                            <td>
                              <StatusBadge
                                status={
                                  order.fulfilled_at
                                    ? "fulfilled"
                                    : order.status
                                }
                              />
                            </td>
                            <td className={styles.amount}>
                              {money(order.quote.subtotalCents / 100)}
                            </td>
                            <td className={styles.dateColumn}>
                              <time dateTime={order.created_at}>
                                {new Date(order.created_at).toLocaleDateString(
                                  undefined,
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </time>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.expandButton}
                                aria-label={`${expanded ? "Hide" : "View"} details for order ${order.id.slice(0, 8)}`}
                                aria-expanded={expanded}
                                aria-controls={
                                  expanded ? `order-${order.id}` : undefined
                                }
                                onClick={() =>
                                  setExpandedOrder(expanded ? null : order.id)
                                }
                              >
                                <ChevronDown size={18} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className={styles.detailRow}>
                              <td colSpan={6}>
                                <div
                                  id={`order-${order.id}`}
                                  className={styles.orderDetails}
                                >
                                  <div>
                                    <h3>Order items</h3>
                                    <ul className={styles.items}>
                                      {order.quote.lines.map((line) => (
                                        <li key={line.variantId}>
                                          <span>
                                            {productName(line.productSlug)}{" "}
                                            <span className={styles.muted}>
                                              × {line.quantity}
                                            </span>
                                          </span>
                                          <strong>
                                            {money(line.lineTotalCents / 100)}
                                          </strong>
                                        </li>
                                      ))}
                                    </ul>
                                    <p className={styles.muted}>
                                      Placed{" "}
                                      {new Date(
                                        order.created_at,
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <h3>Customer & shipping</h3>
                                    <p>
                                      {order.customer_details?.name ||
                                        "Test customer"}
                                    </p>
                                    {order.customer_details?.email && (
                                      <p className={styles.breakWord}>
                                        {order.customer_details.email}
                                      </p>
                                    )}
                                    {order.shipping_details ? (
                                      <p className={styles.shipping}>
                                        {order.shipping_details.name}
                                        <br />
                                        {Object.values(
                                          order.shipping_details.address || {},
                                        )
                                          .filter(Boolean)
                                          .join(", ")}
                                      </p>
                                    ) : (
                                      <p className={styles.muted}>
                                        No shipping details provided.
                                      </p>
                                    )}
                                    {order.fulfilled_at ? (
                                      <p className={styles.fulfilled}>
                                        <Check size={16} aria-hidden="true" />
                                        Fulfilled in sandbox
                                      </p>
                                    ) : (
                                      order.status === "paid" && (
                                        <Button
                                          size="sm"
                                          disabled={busy}
                                          className={styles.fulfillButton}
                                          onClick={() =>
                                            save(
                                              {
                                                action: "fulfill",
                                                id: order.id,
                                              },
                                              order.id,
                                              "Test order marked fulfilled.",
                                            )
                                          }
                                        >
                                          {pendingAction === order.id
                                            ? "Saving…"
                                            : "Mark test order fulfilled"}
                                        </Button>
                                      )
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <footer className={styles.pagination}>
              <span>
                Page {page + 1} · {data.orders.length}{" "}
                {data.orders.length === 1 ? "order" : "orders"} shown
              </span>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || busy}
                  onClick={() => changePage(page - 1)}
                >
                  <ArrowLeft aria-hidden="true" />
                  Previous orders
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.orders.length < 25 || busy}
                  onClick={() => changePage(page + 1)}
                >
                  Next orders
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </footer>
          </>
        ) : section === "stock" ? (
          <div className={styles.stockGrid}>
            {data.stock.length === 0 && (
              <p className={styles.empty}>No active product variants.</p>
            )}
            {data.stock.map((stock) => (
              <form
                key={`${stock.variant_id}:${stock.on_hand}:${stock.reserved}:${stock.initialized}`}
                className={styles.stockCard}
                onSubmit={(e) => {
                  e.preventDefault();
                  save(
                    {
                      action: "stock",
                      variant: stock.variant_id,
                      onHand: Number(
                        new FormData(e.currentTarget).get("onHand"),
                      ),
                      expected: stock.initialized
                        ? { onHand: stock.on_hand, reserved: stock.reserved }
                        : null,
                    },
                    stock.variant_id,
                    `Stock saved for ${stock.name}.`,
                  );
                }}
              >
                <h3>{stock.name}</h3>
                <dl className={styles.stockNumbers}>
                  <div>
                    <dt>Available</dt>
                    <dd>{stock.on_hand - stock.reserved}</dd>
                  </div>
                  <div>
                    <dt>Reserved</dt>
                    <dd>{stock.reserved}</dd>
                  </div>
                </dl>
                <label htmlFor={`stock-${stock.variant_id}`}>
                  On-hand quantity
                </label>
                <div className={styles.stockInput}>
                  <input
                    id={`stock-${stock.variant_id}`}
                    aria-label={`Stock for ${stock.name}`}
                    type="number"
                    name="onHand"
                    defaultValue={stock.on_hand}
                    min={stock.reserved}
                    max={1000000}
                    required
                    disabled={busy}
                  />
                  <Button type="submit" variant="outline" disabled={busy}>
                    {pendingAction === stock.variant_id
                      ? "Saving…"
                      : "Save stock"}
                  </Button>
                </div>
                {!stock.initialized && (
                  <p className={styles.sampleStock}>Default sample stock</p>
                )}
              </form>
            ))}
          </div>
        ) : section === "inbox" ? (
          <div className={styles.messageList}>
            {data.messages.length === 0 && (
              <div className={styles.empty}>
                <Inbox aria-hidden="true" />
                <h3>Your inbox is clear</h3>
                <p>New contact messages will appear here.</p>
              </div>
            )}
            {data.messages.map((message) => (
              <article key={message.id} className={styles.message}>
                <div className={styles.messageHeading}>
                  <div>
                    <h3>{message.subject}</h3>
                    <p className={styles.breakWord}>
                      {message.name} · {message.email}
                    </p>
                  </div>
                  <StatusBadge
                    status={message.handled_at ? "handled" : "pending"}
                  />
                </div>
                <p className={styles.messageBody}>{message.message}</p>
                <div className={styles.messageFooter}>
                  <time dateTime={message.created_at}>
                    {new Date(message.created_at).toLocaleString()}
                  </time>
                  {!message.handled_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        save(
                          { action: "handle-message", id: message.id },
                          message.id,
                          "Message marked handled.",
                        )
                      }
                    >
                      <Check aria-hidden="true" />
                      {pendingAction === message.id
                        ? "Saving…"
                        : "Mark handled"}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emailGrid}>
            <article className={styles.emailCard}>
              <div className={styles.emailHeading}>
                <Mail size={20} aria-hidden="true" />
                <h3>Newsletter subscribers</h3>
              </div>
              <p className={styles.muted}>
                Only confirmed subscribers may receive newsletters.
              </p>
              <CountList
                counts={data.subscribers}
                empty="No subscriptions yet."
              />
              <Button variant="outline" asChild>
                <a href="/api/owner/subscribers">
                  <ArrowDownToLine aria-hidden="true" />
                  Download confirmed subscribers
                </a>
              </Button>
              <p className={styles.exportNote}>
                CSV export · up to 10,000 subscribers
              </p>
            </article>
            <article className={styles.emailCard}>
              <div className={styles.emailHeading}>
                <Inbox size={20} aria-hidden="true" />
                <h3>Email delivery queue</h3>
              </div>
              <p className={styles.muted}>
                Keep track of outgoing messages and delivery status.
              </p>
              <CountList counts={data.mail} empty="The email queue is empty." />
              <p className={styles.deliveryNote}>
                <Info size={16} aria-hidden="true" />
                Messages marked review need delivery reconciliation.
              </p>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
