"use client";
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
import { money, products, productPrice } from "@/data/products";
import { CartReview } from "@/components/cart-review";

export function OrderSummary({ checkout = false }: { checkout?: boolean }) {
  const items = useCart((state) => state.items);
  const count = useCart(selectCartCount);
  const subtotal = useCart(selectCartSubtotal);
  return (
    <aside className="order-summary">
      <div className="flex items-center justify-between">
        <h2>Order summary</h2>
        <span className="text-xs text-neutral-500">{count} items</span>
      </div>
      {checkout && (
        <div className="summary-items">
          {items.length ? (
            items.map((item) => {
              const product = products.find((p) => p.slug === item.slug)!;
              return (
                <div key={item.key} className="summary-item">
                  <MockImage label={product.name} />
                  <div className="min-w-0 flex-1">
                    <strong>{product.name}</strong>
                    <span>
                      {item.size} · Qty {item.quantity}
                    </span>
                  </div>
                  <span>
                    {money(
                      productPrice(product, item.size, item.dietary) *
                        item.quantity,
                    )}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-neutral-500">
              Your sample items will appear here.
            </p>
          )}
        </div>
      )}
      <dl className="summary-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>Estimated shipping</dt>
          <dd className="text-neutral-500">To be confirmed</dd>
        </div>
        <div>
          <dt>Estimated tax</dt>
          <dd className="text-neutral-500">To be confirmed</dd>
        </div>
        <div className="summary-total">
          <dt>Estimated total</dt>
          <dd>
            {money(subtotal)} <small>USD</small>
          </dd>
        </div>
      </dl>
      <p className="fine-print">
        Excludes shipping and tax. Final total is not yet calculated.
      </p>
      {checkout && <CartReview key={JSON.stringify(items)} items={items} />}
      {!checkout && (
        <Button asChild className="mt-6 w-full">
          <Link href="/checkout">
            Continue to checkout
            <ArrowRight />
          </Link>
        </Button>
      )}
      <div className="summary-security">
        <LockKeyhole size={16} />
        <span>
          Payment provider integration proposed.
          <br />
          No payment is collected in this prototype.
        </span>
      </div>
    </aside>
  );
}
export function CartPage() {
  const items = useCart((state) => state.items);
  const ready = useCart((state) => state.ready);
  const count = useCart(selectCartCount);
  const update = useCart((state) => state.update);
  const remove = useCart((state) => state.remove);
  const loadDemo = useLoadDemoCart();
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow="A FEW GOOD THINGS"
        title="Your shopping bag"
        description="A little taste of home, ready for your kitchen."
      />
      {!ready ? (
        <div className="loading-panel" role="status">
          Loading your sample bag…
        </div>
      ) : !items.length ? (
        <EmptyState
          title="Your bag is waiting for something good"
          description="Explore the sample collection, or load a sample bag to preview the complete shopping flow."
        >
          <Button asChild>
            <Link href="/shop">
              Explore products
              <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" onClick={loadDemo}>
            Load sample cart
          </Button>
        </EmptyState>
      ) : (
        <div className="commerce-grid">
          <section>
            <div className="cart-list-heading">
              <h2>
                Your items <span>({count})</span>
              </h2>
              <Button variant="ghost" size="sm" onClick={loadDemo}>
                Reset to sample cart
              </Button>
            </div>
            <div className="cart-items">
              {items.map((item) => {
                const product = products.find((p) => p.slug === item.slug)!;
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
                              productPrice(product, item.size, item.dietary),
                            )}{" "}
                            each · Sample price
                          </span>
                        </div>
                        <strong>
                          {money(
                            productPrice(product, item.size, item.dietary) *
                              item.quantity,
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
                          aria-label={`Remove ${product.name}`}
                          onClick={() => remove(item.key)}
                        >
                          <Trash2 size={14} />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <Link href="/shop" className="text-link mt-6">
              <ArrowLeft size={15} />
              Continue shopping
            </Link>
            <p className="notice mt-8">
              Payment and final shipping/tax calculation would be handled during
              production implementation.
            </p>
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
  return (
    <div className={wide ? "field col-span-2" : "field"}>
      <label htmlFor={name}>
        {label}
        {optional && <span className="text-neutral-500"> (optional)</span>}
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
  const items = useCart((state) => state.items);
  const loadDemo = useLoadDemoCart();
  const [attempted, setAttempted] = useState(false);
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow="GUEST CHECKOUT · UI PREVIEW"
        title="One step closer to home."
        description="A preview of a simple, thoughtful checkout experience. Please use sample details only."
      />
      <div className="checkout-steps">
        <Link href="/cart">Bag</Link>
        <ArrowRight size={14} />
        <strong>Checkout</strong>
        <ArrowRight size={14} />
        <Link href="/order-confirmation">Confirmation preview</Link>
      </div>
      {!items.length && (
        <div className="notice mb-7 flex flex-wrap items-center justify-between gap-3">
          <span>
            Preview the layout below, or add sample items for a complete order
            summary.
          </span>
          <Button variant="outline" size="sm" onClick={loadDemo}>
            Load sample cart
          </Button>
        </div>
      )}
      <div className="commerce-grid">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            toast("Prototype only — no payment was processed.");
          }}
          autoComplete="off"
        >
          <section className="checkout-section">
            <h2>
              <span>01</span>Contact information
            </h2>
            <CheckoutField
              name="checkout-email"
              label="Email address"
              type="email"
              placeholder="customer@example.com"
              wide
            />
            <p className="fine-print mt-3">
              Guest checkout. No account is created and no email is sent.
            </p>
          </section>
          <section className="checkout-section">
            <h2>
              <span>02</span>Shipping details
            </h2>
            <div className="form-grid">
              <CheckoutField
                label="First name"
                name="first-name"
                placeholder="Alex"
              />
              <CheckoutField
                label="Last name"
                name="last-name"
                placeholder="Sample"
              />
              <CheckoutField
                label="Address"
                name="address"
                placeholder="123 Example Street"
                wide
              />
              <CheckoutField
                label="City"
                name="city"
                placeholder="Example City"
              />
              <CheckoutField label="State" name="state" placeholder="State" />
              <CheckoutField label="ZIP code" name="zip" placeholder="00000" />
              <CheckoutField
                label="Phone"
                name="phone"
                type="tel"
                placeholder="(000) 000-0000"
                optional
              />
            </div>
            <p className="fine-print mt-3">
              US address layout for review. Supported shipping regions remain an
              open decision.
            </p>
          </section>
          <section className="checkout-section">
            <h2>
              <span>03</span>Delivery method
            </h2>
            <div className="delivery-option">
              <Truck size={21} />
              <div>
                <strong>Standard delivery — placeholder</strong>
                <p>Delivery times, regions, and rates to be confirmed.</p>
              </div>
              <span className="text-xs">TBC</span>
            </div>
          </section>
          <section className="checkout-section">
            <h2>
              <span>04</span>Payment
            </h2>
            <div className="payment-placeholder">
              <div className="payment-icon">
                <ShieldCheck size={28} strokeWidth={1.3} />
              </div>
              <h3>Secure payment provider integration</h3>
              <p>
                Production implementation proposed using Stripe or another
                approved payment provider.
              </p>
              <div className="payment-explanation">
                <LockKeyhole size={16} />
                <p>
                  Full card details would be processed by the payment provider
                  rather than stored directly by this website.
                </p>
              </div>
              <span className="badge">
                Illustrative only · No card fields or payment processing
              </span>
            </div>
          </section>
          <Button type="submit" className="w-full">
            Place order — prototype
            <ArrowRight />
          </Button>
          <p className="fine-print mt-4 text-center">
            This preview does not submit, transmit, or save your contact and
            shipping details.
          </p>
          <div className={attempted ? "notice mt-6" : "mt-6"}>
            {attempted && (
              <p className="mb-3 text-sm" role="status">
                Prototype only — no payment was processed.
              </p>
            )}
            <Link href="/order-confirmation" className="text-link">
              Preview the order confirmation screen
              <ArrowRight size={15} />
            </Link>
          </div>
        </form>
        <OrderSummary checkout />
      </div>
    </div>
  );
}
export function ConfirmationPage() {
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
      <span className="eyebrow">ORDER CONFIRMATION PREVIEW</span>
      <h1>Thank you for your order.</h1>
      <p>
        A little taste of home is on its way — this is how the production
        confirmation could look.
      </p>
      <div className="notice mt-6">
        Prototype data only. No order was placed, no payment was processed, and
        no email was sent.
      </div>
      <section className="confirmation-card">
        <div className="flex flex-wrap justify-between gap-3 border-b border-neutral-200 pb-5">
          <h2>Order #SIM-DEMO-001</h2>
          <span className="badge">Sample order</span>
        </div>
        <div className="summary-items">
          {sampleItems.map((item) => {
            const product = products.find((p) => p.slug === item.slug)!;
            return (
              <div key={item.key} className="summary-item">
                <MockImage label={product.name} />
                <div className="flex-1">
                  <strong>{product.name}</strong>
                  <span>
                    {item.size} · Qty {item.quantity}
                  </span>
                </div>
                <span>
                  {money(
                    productPrice(product, item.size, item.dietary) *
                      item.quantity,
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-5 font-medium">
          <span>Sample subtotal</span>
          <span>{money(total)}</span>
        </div>
        <p className="fine-print mt-2">Shipping and tax are not included.</p>
      </section>
      <div className="confirmation-next">
        <div>
          <Mail size={22} strokeWidth={1.4} />
          <h3>Confirmation by email</h3>
          <p>
            In production, an order summary would be sent to your email address.
          </p>
        </div>
        <div>
          <PackageCheck size={22} strokeWidth={1.4} />
          <h3>Prepared with care</h3>
          <p>
            Fulfillment steps and delivery updates will follow the approved
            order process.
          </p>
        </div>
      </div>
      <Button asChild>
        <Link href="/shop">
          Continue shopping
          <ArrowRight />
        </Link>
      </Button>
      <Link className="text-link mt-6" href="/scope">
        Back to project scope
      </Link>
    </div>
  );
}
