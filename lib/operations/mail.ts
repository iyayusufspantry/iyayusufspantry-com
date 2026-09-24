import { randomUUID } from "node:crypto";
import { type MailPayload, OperationsStore } from "./store";

export type MailSender = (payload: MailPayload, key: string) => Promise<string>;
export const sendWithResend: MailSender = async (payload, key) => {
  if (
    process.env.EMAIL_DELIVERY_ENABLED !== "true" ||
    !process.env.RESEND_API_KEY
  )
    throw new Error("Email delivery disabled");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error("Email provider did not accept the message");
  const result = await response.json();
  if (typeof result.id !== "string")
    throw new Error("Missing delivery reference");
  return result.id;
};

// Retry with the same immutable payload/key. Beyond the provider's 24-hour
// deduplication window, require review instead of risking a duplicate email.
export async function drainMail(
  store: OperationsStore,
  send: MailSender,
  limit = 5,
) {
  let sent = 0;
  let failed = 0;
  const { pool, schema } = store;
  // Do not deliver obsolete/expired confirmation links after a queue delay or
  // after the recipient has already confirmed, unsubscribed, or requested anew.
  await pool.query(
    `UPDATE ${schema}.mail AS mail SET status='review',lease_id=NULL,lease_until=NULL WHERE status IN ('pending','sending') AND id LIKE 'newsletter-%' AND (lease_until IS NULL OR lease_until<now()) AND NOT EXISTS (SELECT 1 FROM ${schema}.subscribers WHERE confirmation_hash=substring(mail.id from 12) AND status='pending' AND expires_at>now())`,
  );
  await pool.query(
    `UPDATE ${schema}.mail SET status='review',lease_id=NULL,lease_until=NULL WHERE status IN ('pending','sending') AND first_attempt_at < now()-interval '23 hours' AND (lease_until IS NULL OR lease_until<now())`,
  );
  for (let i = 0; i < limit; i++) {
    const lease = randomUUID();
    const result = await pool.query(
      `UPDATE ${schema}.mail SET status='sending',lease_id=$1,lease_until=now()+interval '5 minutes',attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,now()) WHERE id=(SELECT id FROM ${schema}.mail WHERE (status='pending' OR (status='sending' AND lease_until<now())) AND next_attempt_at<=now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id,payload`,
      [lease],
    );
    const mail = result.rows[0] as
      { id: string; payload: MailPayload } | undefined;
    if (!mail) break;
    try {
      const providerId = await send(mail.payload, mail.id);
      await pool.query(
        `UPDATE ${schema}.mail SET status='sent',provider_id=$2,sent_at=now(),lease_id=NULL,lease_until=NULL WHERE id=$1 AND lease_id=$3`,
        [mail.id, providerId, lease],
      );
      sent++;
    } catch {
      await pool.query(
        `UPDATE ${schema}.mail SET status='pending',next_attempt_at=now()+interval '5 minutes',lease_id=NULL,lease_until=NULL WHERE id=$1 AND lease_id=$2`,
        [mail.id, lease],
      );
      failed++;
    }
  }
  return { sent, failed };
}
