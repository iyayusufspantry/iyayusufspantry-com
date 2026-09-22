"use client";
import { useContent } from "@/components/content-provider";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Package, ClipboardList, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/catalog";
import { money } from "@/data/products";

import {
  adjustStock,
  cancelOrder,
  fulfillOrder,
  type CommerceState,
  type Order,
  type Stock,
} from "@/lib/commerce/orders";
import { sampleOwnerState } from "@/lib/commerce/sample";

function StockEditor({
  variantId,
  stock,
  onSave,
}: {
  variantId: string;
  stock: Stock;
  onSave: (quantity: number) => boolean;
}) {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/owner-preview.tsx"];

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
      <label htmlFor={`stock-${variantId}`}>{copy["copy-5"]}</label>
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
          {saved ? copy["copy-6"] : copy["copy-7"]}
        </Button>
      </div>
    </form>
  );
}

export function OwnerPreview() {
  const { products, variants, copy: allCopy } = useContent();
  const copy = allCopy["components/owner-preview.tsx"];
  const statusLabels = {
    pending: copy["copy-1"],
    paid: copy["copy-2"],
    fulfilled: copy["copy-3"],
    cancelled: copy["copy-4"],
  };

  const [state, setState] = useState(() => sampleOwnerState(variants));
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
      setMessage(error instanceof Error ? error.message : copy["copy-8"]);
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
        eyebrow={copy["copy-9"]}
        title={copy["copy-10"]}
        description={copy["copy-11"]}
      />
      <div className="notice owner-notice">
        <div>
          <strong>{copy["copy-12"]}</strong>
          <p> {copy["copy-13"]} </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setState(sampleOwnerState(variants));
            setResetCount(resetCount + 1);
            setFilter("all");
            setStockFilter("all");
            setQuery("");
            setMessage("Sample workspace reset.");
          }}
        >
          <RotateCcw size={15} /> {copy["copy-14"]}{" "}
        </Button>
      </div>
      <div className="owner-stats">
        <div>
          <ClipboardList size={20} />
          <span>{copy["copy-15"]}</span>
          <strong>
            {state.orders.filter((order) => order.status === "paid").length}
          </strong>
          <p>{copy["copy-16"]}</p>
        </div>
        <div>
          <Package size={20} />
          <span>{copy["copy-17"]}</span>
          <strong>
            {state.orders.filter((order) => order.status === "pending").length}
          </strong>
          <p>{copy["copy-18"]}</p>
        </div>
        <div>
          <Package size={20} />
          <span>{copy["copy-19"]}</span>
          <strong>
            {
              Object.values(state.stock).filter(
                (stock) => stock.onHand - stock.reserved <= 5,
              ).length
            }
          </strong>
          <p>{copy["copy-20"]}</p>
        </div>
      </div>
      <p className="owner-feedback" role="status" aria-live="polite">
        {message}
      </p>
      <section aria-labelledby="orders-heading" className="owner-section">
        <div className="owner-section-heading">
          <div>
            <span className="eyebrow">{copy["copy-21"]}</span>
            <h2 id="orders-heading">{copy["copy-22"]}</h2>
          </div>
          <div className="field">
            <label htmlFor="order-filter">{copy["copy-23"]}</label>
            <select
              id="order-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">{copy["copy-24"]}</option>
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
        {!visibleOrders.length && <p className="notice">{copy["copy-25"]}</p>}
      </section>
      <section aria-labelledby="stock-heading" className="owner-section">
        <div className="owner-section-heading">
          <div>
            <span className="eyebrow">{copy["copy-26"]}</span>
            <h2 id="stock-heading">{copy["copy-27"]}</h2>
          </div>
          <span className="fine-print">
            {visibleVariants.length} {copy["copy-28"]}{" "}
          </span>
        </div>
        <div className="owner-filters">
          <div className="field">
            <label htmlFor="stock-search">{copy["copy-29"]}</label>
            <input
              type="search"
              id="stock-search"
              placeholder={copy["copy-30"]}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="stock-filter">{copy["copy-31"]}</label>
            <select
              id="stock-filter"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
            >
              <option value="all">{copy["copy-32"]}</option>
              <option value="low">{copy["copy-33"]}</option>
              <option value="out">{copy["copy-34"]}</option>
            </select>
          </div>
        </div>
        <p className="fine-print mb-5"> {copy["copy-35"]} </p>
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
                    {variant.size} {copy["copy-36"]} {variant.dietary}{" "}
                    {copy["copy-37"]} {money(variant.priceCents / 100)}
                  </p>
                </div>
                <div className="stock-counts">
                  <span className="badge">
                    {available === 0
                      ? copy["copy-38"]
                      : available <= 5
                        ? copy["copy-39"]
                        : copy["copy-40"]}
                  </span>
                  <p>
                    <strong>{available}</strong> {copy["copy-41"]}{" "}
                    {stock.reserved} {copy["copy-42"]}{" "}
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
          <p className="notice"> {copy["copy-43"]} </p>
        )}
      </section>
      <Link className="text-link" href="/prototype">
        <ArrowLeft size={15} /> {copy["copy-44"]}{" "}
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
  const { products, copy: allCopy } = useContent();
  const copy = allCopy["components/owner-preview.tsx"];
  const statusLabels = {
    pending: copy["copy-1"],
    paid: copy["copy-2"],
    fulfilled: copy["copy-3"],
    cancelled: copy["copy-4"],
  };

  return (
    <article className="owner-order-card" aria-label={order.id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3>{order.id}</h3>
        <span className="badge">{statusLabels[order.status]}</span>
      </div>
      <ul>
        {order.quote.lines.map((line) => (
          <li key={line.variantId}>
            {line.quantity} {copy["copy-45"]}{" "}
            {
              products.find((product) => product.slug === line.productSlug)
                ?.name
            }
            <span>{money(line.lineTotalCents / 100)}</span>
          </li>
        ))}
      </ul>
      <p className="fine-print">
        {" "}
        {copy["copy-46"]} {money(order.quote.subtotalCents / 100)}
      </p>
      <div className="mt-5">
        {order.status === "paid" ? (
          <Button onClick={onFulfill}>{copy["copy-47"]}</Button>
        ) : order.status === "pending" ? (
          <Button variant="outline" onClick={onCancel}>
            {" "}
            {copy["copy-48"]}{" "}
          </Button>
        ) : (
          <span className="fine-print">
            {order.status === "fulfilled" ? copy["copy-49"] : copy["copy-50"]}
          </span>
        )}
      </div>
    </article>
  );
}
