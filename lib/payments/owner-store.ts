import type { Pool } from "pg";
import { OperationsStore } from "../operations/store";
import { OperationError } from "../operations/validation";

export class OwnerStore {
  private db: OperationsStore;
  constructor(
    private pool: Pool,
    private schema = "simbiat_checkout_test",
  ) {
    this.db = new OperationsStore(pool, schema);
  }
  async overview(page = 0) {
    const [orders, stock, counts] = await Promise.all([
      this.pool.query(
        `SELECT id,status,quote,customer_details,shipping_details,session_id,created_at,fulfilled_at FROM ${this.schema}.orders ORDER BY created_at DESC,id LIMIT 25 OFFSET $1`,
        [page * 25],
      ),
      this.pool.query(
        `SELECT variant_id,on_hand,reserved FROM ${this.schema}.stock ORDER BY variant_id`,
      ),
      this.pool.query(
        `SELECT status,count(*)::int AS count FROM ${this.schema}.orders GROUP BY status`,
      ),
    ]);
    return { orders: orders.rows, stock: stock.rows, counts: counts.rows };
  }
  async fulfill(id: string, actor: string) {
    return this.db.transaction(async (db) => {
      const order = (
        await db.query(
          `SELECT status,fulfilled_at FROM ${this.schema}.orders WHERE id=$1 FOR UPDATE`,
          [id],
        )
      ).rows[0];
      if (!order) throw new OperationError(404, "Order not found.");
      if (order.status !== "paid")
        throw new OperationError(409, "Only a paid order can be fulfilled.");
      if (order.fulfilled_at) return;
      await db.query(
        `UPDATE ${this.schema}.orders SET fulfilled_at=now(),updated_at=now() WHERE id=$1`,
        [id],
      );
      await db.query(
        `INSERT INTO ${this.schema}.owner_audit(actor,action,reference) VALUES ($1,'fulfill',$2)`,
        [actor, id],
      );
    });
  }
  async stock(
    variant: string,
    onHand: number,
    expected: { onHand: number; reserved: number } | null,
    actor: string,
  ) {
    if (!Number.isSafeInteger(onHand) || onHand < 0 || onHand > 1000000)
      throw new OperationError(
        400,
        "Choose a whole stock quantity from 0 to 1,000,000.",
      );
    return this.db.transaction(async (db) => {
      // The primary key also serializes first-time stock creation against checkout.
      const inserted = await db.query(
        `INSERT INTO ${this.schema}.stock(variant_id,on_hand) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING variant_id`,
        [variant, onHand],
      );
      const row = (
        await db.query(
          `SELECT on_hand,reserved FROM ${this.schema}.stock WHERE variant_id=$1 FOR UPDATE`,
          [variant],
        )
      ).rows[0];
      if (
        (inserted.rowCount && expected) ||
        (!inserted.rowCount &&
          (!expected ||
            row.on_hand !== expected.onHand ||
            row.reserved !== expected.reserved))
      )
        throw new OperationError(
          409,
          "Stock changed. Refresh before saving again.",
        );
      if (onHand < row.reserved)
        throw new OperationError(
          409,
          "Stock cannot be lower than the reserved quantity.",
        );
      await db.query(
        `UPDATE ${this.schema}.stock SET on_hand=$2 WHERE variant_id=$1`,
        [variant, onHand],
      );
      await db.query(
        `INSERT INTO ${this.schema}.owner_audit(actor,action,reference,details) VALUES($1,'stock',$2,$3)`,
        [
          actor,
          variant,
          JSON.stringify({
            before: inserted.rowCount ? null : row.on_hand,
            after: onHand,
            reserved: row.reserved,
          }),
        ],
      );
    });
  }
}
