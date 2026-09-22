"use client";
import { useContent } from "@/components/content-provider";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  ShieldCheck,
  Truck,
  Trash2,
  PackageCheck,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useCart, useLoadDemoCart } from "@/components/cart-provider";
import { selectCartCount, selectCartSubtotal } from "@/lib/cart-store";
import {
  EmptyState,
  MockImage,
  PageHeading,
  QuantitySelector,
} from "@/components/catalog";
import { Button } from "@/components/ui/button";
import { money, productPrice } from "@/data/products";
import { CartReview } from "@/components/cart-review";

export function OrderSummary({ checkout = false }: { checkout?: boolean }) {
  const { variants } = useContent();

  const { products, copy: allCopy } = useContent();
  const copy = allCopy["components/commerce.tsx"];

  const items = useCart((state) => state.items);
  const count = useCart(selectCartCount);
  const subtotal = useCart(selectCartSubtotal);
  return (
    <aside className="order-summary">
      <div className="flex items-center justify-between">
        <h2>{copy["copy-1"]}</h2>
        <span className="text-xs text-neutral-500">
          {count} {copy["copy-2"]}
        </span>
      </div>
      {checkout && (
        <div className="summary-items">
          {items.length ? (
            items.map((item) => {
              const product = products.find((p) => p.slug === item.slug);
              if (
                !product ||
                !variants.some(
                  (v) =>
                    v.productSlug === item.slug &&
                    v.size === item.size &&
                    v.dietary === item.dietary &&
                    v.active,
                )
              )
                return null;
              return (
                <div key={item.key} className="summary-item">
                  <MockImage label={product.name} />
                  <div className="min-w-0 flex-1">
                    <strong>{product.name}</strong>
                    <span>
                      {item.size} {copy["copy-3"]} {item.quantity}
                    </span>
                  </div>
                  <span>
                    {money(
                      productPrice(variants, product, item.size, item.dietary) *
                        item.quantity,
                    )}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-neutral-500"> {copy["copy-4"]} </p>
          )}
        </div>
      )}
      <dl className="summary-totals">
        <div>
          <dt>{copy["copy-5"]}</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>{copy["copy-6"]}</dt>
          <dd className="text-neutral-500">{copy["copy-7"]}</dd>
        </div>
        <div>
          <dt>{copy["copy-8"]}</dt>
          <dd className="text-neutral-500">{copy["copy-9"]}</dd>
        </div>
        <div className="summary-total">
          <dt>{copy["copy-10"]}</dt>
          <dd>
            {money(subtotal)} <small>USD</small>
          </dd>
        </div>
      </dl>
      <p className="fine-print"> {copy["copy-12"]} </p>
      {checkout && <CartReview key={JSON.stringify(items)} items={items} />}
      {!checkout && (
        <Button asChild className="mt-6 w-full">
          <Link href="/checkout">
            {" "}
            {copy["copy-13"]} <ArrowRight />
          </Link>
        </Button>
      )}
      <div className="summary-security">
        <LockKeyhole size={16} />
        <span>
          {" "}
          {copy["copy-14"]} <br /> {copy["copy-15"]}{" "}
        </span>
      </div>
    </aside>
  );
}
export function CartPage() {
  const { variants } = useContent();

  const { products, copy: allCopy } = useContent();
  const copy = allCopy["components/commerce.tsx"];

  const items = useCart((state) => state.items);
  const ready = useCart((state) => state.ready);
  const count = useCart(selectCartCount);
  const update = useCart((state) => state.update);
  const remove = useCart((state) => state.remove);
  const loadDemo = useLoadDemoCart();
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow={copy["copy-16"]}
        title={copy["copy-17"]}
        description={copy["copy-18"]}
      />
      {!ready ? (
        <div className="loading-panel" role="status">
          {" "}
          {copy["copy-19"]}{" "}
        </div>
      ) : !items.length ? (
        <EmptyState title={copy["copy-20"]} description={copy["copy-21"]}>
          <Button asChild>
            <Link href="/shop">
              {" "}
              {copy["copy-22"]} <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" onClick={loadDemo}>
            {" "}
            {copy["copy-23"]}{" "}
          </Button>
        </EmptyState>
      ) : (
        <div className="commerce-grid">
          <section>
            <div className="cart-list-heading">
              <h2>
                {" "}
                {copy["copy-24"]}{" "}
                <span>
                  {copy["copy-25"]}
                  {count}
                  {copy["copy-26"]}
                </span>
              </h2>
              <Button variant="ghost" size="sm" onClick={loadDemo}>
                {" "}
                {copy["copy-27"]}{" "}
              </Button>
            </div>
            <div className="cart-items">
              {items.map((item) => {
                const product = products.find((p) => p.slug === item.slug);
                if (
                  !product ||
                  !variants.some(
                    (v) =>
                      v.productSlug === item.slug &&
                      v.size === item.size &&
                      v.dietary === item.dietary &&
                      v.active,
                  )
                )
                  return null;
                return (
                  <article className="cart-item" key={item.key}>
                    <Link href={`/shop/${product.slug}`}>
                      <MockImage label={product.name} />
                    </Link>
                    <div className="cart-item-content">
                      <div className="flex justify-between gap-3">
                        <div>
                          <h3>
                            <Link href={`/shop/${product.slug}`}>
                              {product.name}
                            </Link>
                          </h3>
                          <p>
                            {item.size}
                            {item.dietary !== "Standard"
                              ? ` · ${item.dietary}`
                              : ""}
                          </p>
                          <span className="text-xs text-neutral-500">
                            {money(
                              productPrice(
                                variants,
                                product,
                                item.size,
                                item.dietary,
                              ),
                            )}{" "}
                            {copy["copy-29"]}{" "}
                          </span>
                        </div>
                        <strong>
                          {money(
                            productPrice(
                              variants,
                              product,
                              item.size,
                              item.dietary,
                            ) * item.quantity,
                          )}
                        </strong>
                      </div>
                      <div className="mt-5 flex items-center justify-between">
                        <QuantitySelector
                          label={`${product.name} quantity`}
                          value={item.quantity}
                          onChange={(value) => update(item.key, value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={copy["template-1"].replaceAll(
                            "{0}",
                            String(product.name),
                          )}
                          onClick={() => remove(item.key)}
                        >
                          <Trash2 size={14} /> {copy["copy-30"]}{" "}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <Link href="/shop" className="text-link mt-6">
              <ArrowLeft size={15} /> {copy["copy-31"]}{" "}
            </Link>
            <p className="notice mt-8"> {copy["copy-32"]} </p>
          </section>
          <OrderSummary />
        </div>
      )}
    </div>
  );
}
function CheckoutField({
  label,
  name,
  type = "text",
  placeholder,
  optional = false,
  wide = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  wide?: boolean;
}) {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/commerce.tsx"];

  return (
    <div className={wide ? "field col-span-2" : "field"}>
      <label htmlFor={name}>
        {label}
        {optional && (
          <span className="text-neutral-500"> {copy["copy-33"]}</span>
        )}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}
export function CheckoutPage() {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/commerce.tsx"];

  const items = useCart((state) => state.items);
  const loadDemo = useLoadDemoCart();
  const [attempted, setAttempted] = useState(false);
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow={copy["copy-34"]}
        title={copy["copy-35"]}
        description={copy["copy-36"]}
      />
      <div className="checkout-steps">
        <Link href="/cart">{copy["copy-37"]}</Link>
        <ArrowRight size={14} />
        <strong>{copy["copy-38"]}</strong>
        <ArrowRight size={14} />
        <Link href="/order-confirmation">{copy["copy-39"]}</Link>
      </div>
      {!items.length && (
        <div className="notice mb-7 flex flex-wrap items-center justify-between gap-3">
          <span> {copy["copy-40"]} </span>
          <Button variant="outline" size="sm" onClick={loadDemo}>
            {" "}
            {copy["copy-41"]}{" "}
          </Button>
        </div>
      )}
      <div className="commerce-grid">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            toast(copy["copy-42"]);
          }}
          autoComplete="off"
        >
          <section className="checkout-section">
            <h2>
              <span>{copy["copy-43"]}</span>
              {copy["copy-44"]}{" "}
            </h2>
            <CheckoutField
              name="checkout-email"
              label={copy["label-2"]}
              type="email"
              placeholder={copy["copy-45"]}
              wide
            />
            <p className="fine-print mt-3"> {copy["copy-46"]} </p>
          </section>
          <section className="checkout-section">
            <h2>
              <span>{copy["copy-47"]}</span>
              {copy["copy-48"]}{" "}
            </h2>
            <div className="form-grid">
              <CheckoutField
                label={copy["label-3"]}
                name="first-name"
                placeholder={copy["copy-49"]}
              />
              <CheckoutField
                label={copy["label-4"]}
                name="last-name"
                placeholder={copy["copy-50"]}
              />
              <CheckoutField
                label={copy["label-5"]}
                name="address"
                placeholder={copy["copy-51"]}
                wide
              />
              <CheckoutField
                label={copy["label-6"]}
                name="city"
                placeholder={copy["copy-52"]}
              />
              <CheckoutField
                label={copy["label-7"]}
                name="state"
                placeholder={copy["copy-53"]}
              />
              <CheckoutField
                label={copy["label-8"]}
                name="zip"
                placeholder={copy["copy-54"]}
              />
              <CheckoutField
                label={copy["label-9"]}
                name="phone"
                type="tel"
                placeholder={copy["copy-55"]}
                optional
              />
            </div>
            <p className="fine-print mt-3"> {copy["copy-56"]} </p>
          </section>
          <section className="checkout-section">
            <h2>
              <span>{copy["copy-57"]}</span>
              {copy["copy-58"]}{" "}
            </h2>
            <div className="delivery-option">
              <Truck size={21} />
              <div>
                <strong>{copy["copy-59"]}</strong>
                <p>{copy["copy-60"]}</p>
              </div>
              <span className="text-xs">{copy["copy-61"]}</span>
            </div>
          </section>
          <section className="checkout-section">
            <h2>
              <span>{copy["copy-62"]}</span>
              {copy["copy-63"]}{" "}
            </h2>
            <div className="payment-placeholder">
              <div className="payment-icon">
                <ShieldCheck size={28} strokeWidth={1.3} />
              </div>
              <h3>{copy["copy-64"]}</h3>
              <p> {copy["copy-65"]} </p>
              <div className="payment-explanation">
                <LockKeyhole size={16} />
                <p> {copy["copy-66"]} </p>
              </div>
              <span className="badge"> {copy["copy-67"]} </span>
            </div>
          </section>
          <Button type="submit" className="w-full">
            {" "}
            {copy["copy-68"]} <ArrowRight />
          </Button>
          <p className="fine-print mt-4 text-center"> {copy["copy-69"]} </p>
          <div className={attempted ? "notice mt-6" : "mt-6"}>
            {attempted && (
              <p className="mb-3 text-sm" role="status">
                {" "}
                {copy["copy-70"]}{" "}
              </p>
            )}
            <Link href="/order-confirmation" className="text-link">
              {" "}
              {copy["copy-71"]} <ArrowRight size={15} />
            </Link>
          </div>
        </form>
        <OrderSummary checkout />
      </div>
    </div>
  );
}
export function ConfirmationPage() {
  const { variants } = useContent();

  const { products, copy: allCopy } = useContent();
  const copy = allCopy["components/commerce.tsx"];

  const items = useCart((state) => state.items);
  const subtotal = useCart(selectCartSubtotal);
  const sampleItems = items.length
    ? items
    : products.slice(0, 3).map((p) => ({
        key: p.slug,
        slug: p.slug,
        size: p.sizes?.[0] ?? "Standard",
        dietary: p.dietary?.[0] ?? "Standard",
        quantity: 1,
      }));
  const total = items.length
    ? subtotal
    : products.slice(0, 3).reduce((sum, p) => sum + p.price, 0);
  return (
    <div className="confirmation-page site-container">
      <div className="confirmation-check">
        <Check size={32} strokeWidth={1.4} />
      </div>
      <span className="eyebrow">{copy["copy-74"]}</span>
      <h1>{copy["copy-75"]}</h1>
      <p> {copy["copy-76"]} </p>
      <div className="notice mt-6"> {copy["copy-77"]} </div>
      <section className="confirmation-card">
        <div className="flex flex-wrap justify-between gap-3 border-b border-neutral-200 pb-5">
          <h2>{copy["copy-78"]}</h2>
          <span className="badge">{copy["copy-79"]}</span>
        </div>
        <div className="summary-items">
          {sampleItems.map((item) => {
            const product = products.find((p) => p.slug === item.slug);
            if (
              !product ||
              !variants.some(
                (v) =>
                  v.productSlug === item.slug &&
                  v.size === item.size &&
                  v.dietary === item.dietary &&
                  v.active,
              )
            )
              return null;
            return (
              <div key={item.key} className="summary-item">
                <MockImage label={product.name} />
                <div className="flex-1">
                  <strong>{product.name}</strong>
                  <span>
                    {item.size} {copy["copy-80"]} {item.quantity}
                  </span>
                </div>
                <span>
                  {money(
                    productPrice(variants, product, item.size, item.dietary) *
                      item.quantity,
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-5 font-medium">
          <span>{copy["copy-81"]}</span>
          <span>{money(total)}</span>
        </div>
        <p className="fine-print mt-2">{copy["copy-82"]}</p>
      </section>
      <div className="confirmation-next">
        <div>
          <Mail size={22} strokeWidth={1.4} />
          <h3>{copy["copy-83"]}</h3>
          <p> {copy["copy-84"]} </p>
        </div>
        <div>
          <PackageCheck size={22} strokeWidth={1.4} />
          <h3>{copy["copy-85"]}</h3>
          <p> {copy["copy-86"]} </p>
        </div>
      </div>
      <Button asChild>
        <Link href="/shop">
          {" "}
          {copy["copy-87"]} <ArrowRight />
        </Link>
      </Button>
      <Link className="text-link mt-6" href="/scope">
        {" "}
        {copy["copy-88"]}{" "}
      </Link>
    </div>
  );
}
