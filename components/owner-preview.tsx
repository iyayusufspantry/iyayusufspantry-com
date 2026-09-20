"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Package, ClipboardList, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/catalog";
import { products, money } from "@/data/products";
import { variants } from "@/lib/commerce/catalog";
import {
  adjustStock,
  cancelOrder,
  fulfillOrder,
  type CommerceState,
  type Order,
  type Stock,
} from "@/lib/commerce/orders";
import { sampleOwnerState } from "@/lib/commerce/sample";

const statusLabels = {
  pending: "Awaiting payment",
  paid: "Ready to pack",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

function StockEditor({
  variantId,
  stock,
  onSave,
}: {
  variantId: string;
  stock: Stock;
  onSave: (quantity: number) => boolean;
}) {
  const [draft, setDraft] = useState(String(stock.onHand));
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="stock-editor"
      onSubmit={(event) => {
        event.preventDefault();
        if (onSave(draft.trim() ? Number(draft) : NaN)) setSaved(true);
      }}
    >
      <label htmlFor={`stock-${variantId}`}>On hand</label>
      <div className="flex gap-2">
        <input
          id={`stock-${variantId}`}
          type="number"
          min={stock.reserved}
          max={999999}
          step={1}
          required
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setSaved(false);
          }}
        />
        <Button size="sm" variant="outline" type="submit">
          {saved ? "Saved" : "Save stock"}
        </Button>
      </div>
    </form>
  );
}

export function OwnerPreview() {
  const [state, setState] = useState(sampleOwnerState);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [resetCount, setResetCount] = useState(0);
  function change(
    action: (current: CommerceState) => CommerceState,
    success: string,
  ) {
    try {
      setState(action(state));
      setMessage(success);
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update sample data.",
      );
      return false;
    }
  }
  const visibleOrders = state.orders.filter(
    (order) => filter === "all" || order.status === filter,
  );
  const visibleVariants = variants.filter((variant) => {
    const product = products.find(
      (entry) => entry.slug === variant.productSlug,
    )!;
    const available =
      state.stock[variant.id].onHand - state.stock[variant.id].reserved;
    return (
      `${product.name} ${variant.size} ${variant.dietary}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (stockFilter === "all" ||
        (stockFilter === "low" && available > 0 && available <= 5) ||
        (stockFilter === "out" && available === 0))
    );
  });
  return (
    <div className="site-container page-bottom owner-preview">
      <PageHeading
        eyebrow="BUSINESS TOOLS · SAMPLE WORKSPACE"
        title="Your store, at a glance."
        description="A place to review orders, prepare deliveries, and keep your shelves up to date."
      />
      <div className="notice owner-notice">
        <div>
          <strong>Owner dashboard preview</strong>
          <p>
            Fictional orders and stock for review. Changes stay on this page and
            reset when you refresh. This preview does not update the storefront
            or accept payments.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setState(sampleOwnerState());
            setResetCount(resetCount + 1);
            setFilter("all");
            setStockFilter("all");
            setQuery("");
            setMessage("Sample workspace reset.");
          }}
        >
          <RotateCcw size={15} />
          Reset sample workspace
        </Button>
      </div>
      <div className="owner-stats">
        <div>
          <ClipboardList size={20} />
          <span>Ready to pack</span>
          <strong>
            {state.orders.filter((order) => order.status === "paid").length}
          </strong>
          <p>Paid sample orders</p>
        </div>
        <div>
          <Package size={20} />
          <span>Awaiting payment</span>
          <strong>
            {state.orders.filter((order) => order.status === "pending").length}
          </strong>
          <p>Stock held in reserve</p>
        </div>
        <div>
          <Package size={20} />
          <span>Low or empty stock</span>
          <strong>
            {
              Object.values(state.stock).filter(
                (stock) => stock.onHand - stock.reserved <= 5,
              ).length
            }
          </strong>
          <p>Variants to review</p>
        </div>
      </div>
      <p className="owner-feedback" role="status" aria-live="polite">
        {message}
      </p>
      <section aria-labelledby="orders-heading" className="owner-section">
        <div className="owner-section-heading">
          <div>
            <span className="eyebrow">ORDER BOOK</span>
            <h2 id="orders-heading">Orders to look after</h2>
          </div>
          <div className="field">
            <label htmlFor="order-filter">Order status</label>
            <select
              id="order-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All orders</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="owner-orders">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onFulfill={() =>
                change(
                  (current) => fulfillOrder(current, order.id),
                  `${order.id} marked fulfilled in this preview.`,
                )
              }
              onCancel={() =>
                change(
                  (current) => cancelOrder(current, order.id),
                  `${order.id} cancelled. Reserved sample stock released.`,
                )
              }
            />
          ))}
        </div>
        {!visibleOrders.length && (
          <p className="notice">No sample orders with this status.</p>
        )}
      </section>
      <section aria-labelledby="stock-heading" className="owner-section">
        <div className="owner-section-heading">
          <div>
            <span className="eyebrow">THE STOCKROOM</span>
            <h2 id="stock-heading">Keep your shelves ready</h2>
          </div>
          <span className="fine-print">
            {visibleVariants.length} sample variants
          </span>
        </div>
        <div className="owner-filters">
          <div className="field">
            <label htmlFor="stock-search">Search stock</label>
            <input
              type="search"
              id="stock-search"
              placeholder="Product, size, or dietary option"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="stock-filter">Availability</label>
            <select
              id="stock-filter"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
            >
              <option value="all">All stock</option>
              <option value="low">Low stock (1–5)</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>
        <p className="fine-print mb-5">
          Available = on hand minus reserved. Reserved units belong to orders
          awaiting payment.
        </p>
        <div className="owner-stock-list">
          {visibleVariants.map((variant) => {
            const product = products.find(
              (entry) => entry.slug === variant.productSlug,
            )!;
            const stock = state.stock[variant.id];
            const available = stock.onHand - stock.reserved;
            return (
              <article
                className="owner-stock-row"
                key={variant.id}
                aria-label={`${product.name} ${variant.size} ${variant.dietary}`}
              >
                <div>
                  <h3>{product.name}</h3>
                  <p className="fine-print">
                    {variant.size} · {variant.dietary} ·{" "}
                    {money(variant.priceCents / 100)}
                  </p>
                </div>
                <div className="stock-counts">
                  <span className="badge">
                    {available === 0
                      ? "Out of stock"
                      : available <= 5
                        ? "Low stock"
                        : "In stock"}
                  </span>
                  <p>
                    <strong>{available}</strong> available · {stock.reserved}{" "}
                    reserved
                  </p>
                </div>
                <StockEditor
                  key={`${resetCount}-${stock.onHand}`}
                  variantId={variant.id}
                  stock={stock}
                  onSave={(quantity) =>
                    change(
                      (current) => adjustStock(current, variant.id, quantity),
                      `${product.name} sample stock updated.`,
                    )
                  }
                />
              </article>
            );
          })}
        </div>
        {!visibleVariants.length && (
          <p className="notice">
            No matching variants. Try another search or availability filter.
          </p>
        )}
      </section>
      <Link className="text-link" href="/prototype">
        <ArrowLeft size={15} />
        Back to screen directory
      </Link>
    </div>
  );
}

function OrderCard({
  order,
  onFulfill,
  onCancel,
}: {
  order: Order;
  onFulfill: () => void;
  onCancel: () => void;
}) {
  return (
    <article className="owner-order-card" aria-label={order.id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3>{order.id}</h3>
        <span className="badge">{statusLabels[order.status]}</span>
      </div>
      <ul>
        {order.quote.lines.map((line) => (
          <li key={line.variantId}>
            {line.quantity} ×{" "}
            {
              products.find((product) => product.slug === line.productSlug)
                ?.name
            }
            <span>{money(line.lineTotalCents / 100)}</span>
          </li>
        ))}
      </ul>
      <p className="fine-print">
        Sample merchandise subtotal · {money(order.quote.subtotalCents / 100)}
      </p>
      <div className="mt-5">
        {order.status === "paid" ? (
          <Button onClick={onFulfill}>Mark fulfilled</Button>
        ) : order.status === "pending" ? (
          <Button variant="outline" onClick={onCancel}>
            Cancel reservation
          </Button>
        ) : (
          <span className="fine-print">
            {order.status === "fulfilled"
              ? "This sample order has been packed and sent."
              : "The sample reservation has been released."}
          </span>
        )}
      </div>
    </article>
  );
}
