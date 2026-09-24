import { createHash, randomBytes } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { OperationError, contactInput } from "./validation";

export type MailPayload = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  reply_to?: string;
};
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export class OperationsStore {
  constructor(
    public readonly pool: Pool,
    public readonly schema = "simbiat_operations",
  ) {
    if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("Invalid schema");
  }
  async transaction<T>(work: (db: PoolClient) => Promise<T>) {
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
  async limit(key: string, maximum: number, seconds = 900) {
    const result = await this.pool.query(
      `INSERT INTO ${this.schema}.rate_limits(key,hits,expires_at) VALUES ($1,1,now()+$2*interval '1 second')
       ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN ${this.schema}.rate_limits.expires_at<=now() THEN 1 ELSE ${this.schema}.rate_limits.hits+1 END,
       expires_at=CASE WHEN ${this.schema}.rate_limits.expires_at<=now() THEN now()+$2*interval '1 second' ELSE ${this.schema}.rate_limits.expires_at END RETURNING hits`,
      [key, seconds],
    );
    if (result.rows[0].hits > maximum)
      throw new OperationError(
        429,
        "Too many requests. Please try again later.",
      );
  }
  async enqueue(
    id: string,
    payload: MailPayload,
    db: Pool | PoolClient = this.pool,
  ) {
    await db.query(
      `INSERT INTO ${this.schema}.mail(id,payload) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [id, JSON.stringify(payload)],
    );
  }
  async contact(
    input: ReturnType<typeof contactInput>,
    notification?: { from: string; to: string },
  ) {
    const fingerprint = tokenHash(JSON.stringify(input));
    return this.transaction(async (db) => {
      const result = await db.query(
        `INSERT INTO ${this.schema}.contact_messages(id,fingerprint,name,email,subject,message) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id`,
        [
          input.id,
          fingerprint,
          input.name,
          input.email,
          input.subject,
          input.message,
        ],
      );
      if (!result.rowCount) {
        const existing = await db.query(
          `SELECT fingerprint FROM ${this.schema}.contact_messages WHERE id=$1`,
          [input.id],
        );
        if (existing.rows[0]?.fingerprint !== fingerprint)
          throw new OperationError(
            409,
            "Your message changed. Submit it again.",
          );
      }
      if (notification)
        await this.enqueue(
          `contact-${input.id}`,
          {
            from: notification.from,
            to: [notification.to],
            reply_to: input.email,
            subject: `New pantry message: ${input.subject}`,
            text: `From ${input.name} (${input.email})\n\n${input.message}\n\nReference: ${input.id}`,
          },
          db,
        );
    });
  }
  async subscribe(email: string, origin: string, from: string) {
    return this.transaction(async (db) => {
      await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
        `newsletter:${email}`,
      ]);
      const previous = (
        await db.query(
          `SELECT * FROM ${this.schema}.subscribers WHERE email=$1 FOR UPDATE`,
          [email],
        )
      ).rows[0];
      // Do not disclose existing membership or send repeated confirmation mail.
      if (
        previous?.status === "subscribed" ||
        (previous?.status === "pending" &&
          new Date(previous.expires_at).getTime() > Date.now())
      )
        return;
      const confirmation = randomBytes(32).toString("hex");
      const unsubscribe = randomBytes(32).toString("hex");
      await db.query(
        `INSERT INTO ${this.schema}.subscribers(email,status,confirmation_hash,unsubscribe_hash,expires_at,consent_version) VALUES ($1,'pending',$2,$3,now()+interval '24 hours','newsletter-v1') ON CONFLICT(email) DO UPDATE SET status='pending',confirmation_hash=$2,unsubscribe_hash=$3,expires_at=now()+interval '24 hours',consent_version='newsletter-v1',confirmed_at=NULL,updated_at=now()`,
        [email, tokenHash(confirmation), tokenHash(unsubscribe)],
      );
      await this.enqueue(
        `newsletter-${tokenHash(confirmation)}`,
        {
          from,
          to: [email],
          subject: "Confirm your pantry newsletter subscription",
          text: `You requested news and recipes from Iya Yusuf's Pantry. Confirm within 24 hours:\n${origin}/newsletter/confirm#token=${confirmation}\n\nIf you did not request this, ignore this email. You will not be subscribed.\n\nYou can unsubscribe using this link:\n${origin}/newsletter/unsubscribe#token=${unsubscribe}`,
        },
        db,
      );
    });
  }
  async subscriptionAction(token: string, action: "confirm" | "unsubscribe") {
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new OperationError(400, "This link is invalid or expired.");
    if (action === "unsubscribe") {
      const result = await this.pool.query(
        `UPDATE ${this.schema}.subscribers SET status='unsubscribed',updated_at=now() WHERE unsubscribe_hash=$1 RETURNING email`,
        [tokenHash(token)],
      );
      if (!result.rowCount)
        throw new OperationError(400, "This link is invalid or expired.");
      return;
    }
    const result = await this.pool.query(
      `UPDATE ${this.schema}.subscribers SET status='subscribed',confirmed_at=COALESCE(confirmed_at,now()),updated_at=now() WHERE confirmation_hash=$1 AND status IN ('pending','subscribed') AND expires_at>now() RETURNING email`,
      [tokenHash(token)],
    );
    if (!result.rowCount)
      throw new OperationError(
        400,
        "This link is invalid or expired. Subscribe again to get a new link.",
      );
  }
  async overview() {
    const [messages, subscribers, mail] = await Promise.all([
      this.pool.query(
        `SELECT id,name,email,subject,message,created_at,handled_at FROM ${this.schema}.contact_messages ORDER BY created_at DESC LIMIT 100`,
      ),
      this.pool.query(
        `SELECT status,count(*)::int AS count FROM ${this.schema}.subscribers GROUP BY status`,
      ),
      this.pool.query(
        `SELECT status,count(*)::int AS count FROM ${this.schema}.mail GROUP BY status`,
      ),
    ]);
    return {
      messages: messages.rows,
      subscribers: subscribers.rows,
      mail: mail.rows,
    };
  }
  async handleMessage(id: string) {
    const result = await this.pool.query(
      `UPDATE ${this.schema}.contact_messages SET handled_at=COALESCE(handled_at,now()) WHERE id=$1 RETURNING id`,
      [id],
    );
    if (!result.rowCount) throw new OperationError(404, "Message not found.");
  }
}
