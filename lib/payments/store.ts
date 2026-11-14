import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type Stripe from "stripe";
import {
  CommerceError,
  parseSelections,
  quoteCart,
  type Quote,
  type Variant,
} from "../commerce/catalog";
import { sampleStock } from "../commerce/sample";
import { productTaxCode } from "./product-tax";

export type PaymentOrder = {
  id: string;
  cart_hash: string;
  status: "pending" | "paid" | "cancelled" | "review";
  quote: Quote;
  stripe_params: Stripe.Checkout.SessionCreateParams;
  session_id: string | null;
  checkout_url: string | null;
  payment_id: string | null;
  customer_details?: { email?: string | null } | null;
  created_at: Date;
};

export const checkoutEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

// A separate schema keeps all sandbox orders and sample inventory out of live data.
export class PaymentStore {
  private readonly schema: string;
  readonly live: boolean;
  readonly integration: string;
  constructor(
    private readonly pool: Pool,
    schema = "simbiat_checkout_test",
    options: { live?: boolean } = {},
  ) {
    if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("Invalid schema");
    this.schema = schema;
    this.live = options.live === true;
    if (this.live && schema === "simbiat_checkout_test")
      throw new Error("Live orders require separate inventory");
    this.integration = this.live ? "simbiat-live-v1" : "simbiat-sandbox-v1";
  }
  private async transaction<T>(work: (db: PoolClient) => Promise<T>) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      await db.query("SET LOCAL lock_timeout = '10s'");
      const result = await work(db);
      await db.query("COMMIT");
      return result;
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    } finally {
      db.release();
    }
  }
  async reserve(
    id: string,
    input: unknown,
    variants: Variant[],
    origin: string,
    names: Record<string, string>,
  ) {
    const items = parseSelections(input).sort((a, b) =>
      a.variantId.localeCompare(b.variantId),
    );
    const hash = createHash("sha256")
      .update(JSON.stringify(items))
      .digest("hex");
    return this.transaction(async (db) => {
      // Serialize duplicate requests even before their order row exists.
      await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
        id,
      ]);
      const existing = await db.query<PaymentOrder>(
        `SELECT * FROM ${this.schema}.orders WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].cart_hash !== hash)
          throw new CommerceError(
            "CART_CHANGED",
            "Your bag changed. Start a new checkout.",
          );
        return existing.rows[0];
      }
      const available: Record<string, number> = {};
      const seed = sampleStock(variants);
      for (const item of items) {
        if (!variants.some((v) => v.id === item.variantId && v.active))
          throw new CommerceError(
            "UNAVAILABLE_VARIANT",
            "An item is no longer available.",
          );
        // Seed each variant once, only in this sandbox schema. Never reset sold stock.
        if (!this.live)
          await db.query(
            `INSERT INTO ${this.schema}.stock (variant_id, on_hand) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [item.variantId, seed[item.variantId].onHand],
          );
        const stock = await db.query(
          `SELECT on_hand - reserved AS available FROM ${this.schema}.stock WHERE variant_id = $1 FOR UPDATE`,
          [item.variantId],
        );
        available[item.variantId] = stock.rows[0]?.available ?? 0;
      }
      const quote = quoteCart(items, variants, available);
      const shippingCents = this.live && quote.subtotalCents < 6000 ? 699 : 0;
      if (this.live)
        Object.assign(quote, {
          shippingCents,
          taxCents: 0,
          totalCents: quote.subtotalCents + shippingCents,
        });
      if (quote.subtotalCents < 50)
        throw new CommerceError(
          "MINIMUM_TOTAL",
          "Choose at least $0.50 of items.",
        );
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        adaptive_pricing: { enabled: false },
        payment_method_types: ["card"],
        client_reference_id: id,
        metadata: { order_id: id, integration: this.integration },
        payment_intent_data: {
          metadata: { order_id: id, integration: this.integration },
        },
        line_items: quote.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "usd",
            ...(this.live ? { tax_behavior: "exclusive" as const } : {}),
            unit_amount: line.unitPriceCents,
            product_data: {
              name: `${names[line.productSlug] || line.productSlug} (${variants.find((v) => v.id === line.variantId)?.size})`,
              ...(this.live
                ? { tax_code: productTaxCode(line.productSlug) }
                : {}),
            },
          },
        })),
        shipping_address_collection: { allowed_countries: ["US"] },
        automatic_tax: { enabled: this.live },
        ...(this.live
          ? {
              billing_address_collection: "required" as const,
              shipping_options: [
                {
                  shipping_rate_data: {
                    display_name: shippingCents
                      ? "Standard shipping"
                      : "Free standard shipping",
                    type: "fixed_amount" as const,
                    fixed_amount: { amount: shippingCents, currency: "usd" },
                    tax_behavior: "exclusive" as const,
                  },
                },
              ],
            }
          : {}),
        custom_text: {
          submit: {
            message: this.live
              ? "US delivery. Your final shipping and tax are shown before payment."
              : "Sandbox test only. No goods will be shipped. Shipping and tax are $0 for this test.",
          },
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout?cancelled=1`,
      };
      for (const line of quote.lines)
        await db.query(
          `UPDATE ${this.schema}.stock SET reserved = reserved + $2 WHERE variant_id = $1`,
          [line.variantId, line.quantity],
        );
      const result = await db.query<PaymentOrder>(
        `INSERT INTO ${this.schema}.orders (id, cart_hash, quote, stripe_params) VALUES ($1,$2,$3,$4) RETURNING *`,
        [id, hash, JSON.stringify(quote), JSON.stringify(params)],
      );
      return result.rows[0];
    });
  }

  async attachSession(orderId: string, session: Stripe.Checkout.Session) {
    if (
      session.livemode !== this.live ||
      session.metadata?.order_id !== orderId ||
      session.metadata?.integration !== this.integration
    )
      throw new Error("Session mismatch");
    await this.pool.query(
      `UPDATE ${this.schema}.orders SET session_id = $2, checkout_url = $3, updated_at = now() WHERE id = $1 AND (session_id IS NULL OR session_id = $2)`,
      [orderId, session.id, session.url],
    );
  }

  async findSession(sessionId: string) {
    const result = await this.pool.query<PaymentOrder>(
      `SELECT * FROM ${this.schema}.orders WHERE session_id = $1`,
      [sessionId],
    );
    return result.rows[0];
  }

  async pending() {
    const result = await this.pool.query<PaymentOrder>(
      `SELECT * FROM ${this.schema}.orders WHERE status = 'pending' ORDER BY last_reconciled_at NULLS FIRST, created_at LIMIT 100`,
    );
    return result.rows;
  }

  async markReconciled(id: string) {
    await this.pool.query(
      `UPDATE ${this.schema}.orders SET last_reconciled_at=now() WHERE id=$1`,
      [id],
    );
  }

  async processEvent(event: Stripe.Event) {
    if (!checkoutEvents.has(event.type)) return "ignored";
    if (event.livemode !== this.live) throw new Error("Payment mode mismatch");
    const session = event.data.object as Stripe.Checkout.Session;
    // A Stripe account may be shared with other integrations.
    if (session.metadata?.integration !== this.integration) return "ignored";
    if (
      session.livemode !== this.live ||
      session.mode !== "payment" ||
      !session.id.startsWith(this.live ? "cs_live_" : "cs_test_")
    )
      throw new Error("Invalid checkout session");
    const orderId = session.metadata.order_id;
    if (!orderId || session.client_reference_id !== orderId)
      throw new Error("Invalid order reference");
    return this.transaction(async (db) => {
      const result = await db.query<PaymentOrder>(
        `SELECT * FROM ${this.schema}.orders WHERE id = $1 FOR UPDATE`,
        [orderId],
      );
      const order = result.rows[0];
      if (!order) throw new Error("Order not found; retry event delivery");
      if (order.session_id && order.session_id !== session.id)
        throw new Error("Checkout session mismatch");
      const inserted = await db.query(
        `INSERT INTO ${this.schema}.events(id,order_id,type) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id`,
        [event.id, order.id, event.type],
      );
      if (!inserted.rowCount) return "duplicate";
      await db.query(
        `UPDATE ${this.schema}.orders SET session_id = $2 WHERE id = $1`,
        [order.id, session.id],
      );
      const successful =
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded";
      if (successful && session.payment_status === "paid") {
        const paymentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        const shipping = session.total_details?.amount_shipping ?? 0;
        const tax = session.total_details?.amount_tax ?? 0;
        const expectedShipping = this.live ? order.quote.shippingCents : 0;
        const total = order.quote.subtotalCents + shipping + tax;
        if (
          !paymentId ||
          session.amount_subtotal !== order.quote.subtotalCents ||
          session.amount_total !== total ||
          !Number.isSafeInteger(total) ||
          !Number.isSafeInteger(shipping) ||
          shipping < 0 ||
          !Number.isSafeInteger(tax) ||
          tax < 0 ||
          shipping !== expectedShipping ||
          session.currency?.toUpperCase() !== order.quote.currency ||
          (session.total_details?.amount_discount ?? 0) !== 0 ||
          (!this.live && tax !== 0) ||
          (this.live &&
            (!session.automatic_tax?.enabled ||
              session.automatic_tax.status !== "complete"))
        )
          throw new Error("Payment amount or currency mismatch");
        if (order.payment_id && order.payment_id !== paymentId)
          throw new Error("Payment ID mismatch");
        if (order.status === "paid" || order.status === "review")
          return "duplicate";
        // Never silently fulfill a late payment whose reservation was already released.
        if (order.status === "pending") {
          for (const line of order.quote.lines)
            await db.query(
              `UPDATE ${this.schema}.stock SET on_hand = on_hand - $2, reserved = reserved - $2 WHERE variant_id = $1`,
              [line.variantId, line.quantity],
            );
        }
        await db.query(
          `UPDATE ${this.schema}.orders SET status = $2, payment_id = $3, customer_details = $4, shipping_details = $5, quote = $6, updated_at = now() WHERE id = $1`,
          [
            order.id,
            order.status === "cancelled" ? "review" : "paid",
            paymentId,
            JSON.stringify(session.customer_details),
            JSON.stringify(
              session.collected_information?.shipping_details ?? null,
            ),
            JSON.stringify(
              this.live
                ? {
                    ...order.quote,
                    shippingCents: shipping,
                    taxCents: tax,
                    totalCents: total,
                  }
                : order.quote,
            ),
          ],
        );
      } else if (!successful && order.status === "pending") {
        for (const line of order.quote.lines)
          await db.query(
            `UPDATE ${this.schema}.stock SET reserved = reserved - $2 WHERE variant_id = $1`,
            [line.variantId, line.quantity],
          );
        await db.query(
          `UPDATE ${this.schema}.orders SET status = 'cancelled', updated_at = now() WHERE id = $1`,
          [order.id],
        );
      }
      return "processed";
    });
  }
}
