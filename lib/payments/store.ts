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
  constructor(
    private readonly pool: Pool,
    schema = "simbiat_checkout_test",
  ) {
    if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("Invalid schema");
    this.schema = schema;
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
        if (!seed[item.variantId])
          throw new CommerceError(
            "UNAVAILABLE_VARIANT",
            "An item is no longer available.",
          );
        // Seed each variant once, only in this sandbox schema. Never reset sold stock.
        await db.query(
          `INSERT INTO ${this.schema}.stock (variant_id, on_hand) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [item.variantId, seed[item.variantId].onHand],
        );
        const stock = await db.query(
          `SELECT on_hand - reserved AS available FROM ${this.schema}.stock WHERE variant_id = $1 FOR UPDATE`,
          [item.variantId],
        );
        available[item.variantId] = stock.rows[0].available;
      }
      const quote = quoteCart(items, variants, available);
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
        metadata: { order_id: id, integration: "simbiat-sandbox-v1" },
        payment_intent_data: {
          metadata: { order_id: id, integration: "simbiat-sandbox-v1" },
        },
        line_items: quote.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "usd",
            unit_amount: line.unitPriceCents,
            product_data: {
              name: `${names[line.productSlug] || line.productSlug} (${variants.find((v) => v.id === line.variantId)?.size})`,
            },
          },
        })),
        shipping_address_collection: { allowed_countries: ["US"] },
        automatic_tax: { enabled: false },
        custom_text: {
          submit: {
            message:
              "Sandbox test only. No goods will be shipped. Shipping and tax are $0 for this test.",
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
    if (session.livemode || session.metadata?.order_id !== orderId)
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
    if (event.livemode) throw new Error("Live events are disabled");
    const session = event.data.object as Stripe.Checkout.Session;
    // A Stripe account may be shared with other integrations.
    if (session.metadata?.integration !== "simbiat-sandbox-v1")
      return "ignored";
    if (
      session.livemode ||
      session.mode !== "payment" ||
      !session.id.startsWith("cs_test_")
    )
      throw new Error("Invalid sandbox session");
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
        if (
          !paymentId ||
          session.amount_subtotal !== order.quote.subtotalCents ||
          session.amount_total !== order.quote.subtotalCents ||
          session.currency?.toUpperCase() !== order.quote.currency ||
          (session.total_details?.amount_discount ?? 0) !== 0 ||
          (session.total_details?.amount_tax ?? 0) !== 0 ||
          (session.total_details?.amount_shipping ?? 0) !== 0
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
          `UPDATE ${this.schema}.orders SET status = $2, payment_id = $3, customer_details = $4, shipping_details = $5, updated_at = now() WHERE id = $1`,
          [
            order.id,
            order.status === "cancelled" ? "review" : "paid",
            paymentId,
            JSON.stringify(session.customer_details),
            JSON.stringify(
              session.collected_information?.shipping_details ?? null,
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
