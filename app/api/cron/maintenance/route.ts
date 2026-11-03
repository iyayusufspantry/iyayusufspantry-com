import { timingSafeEqual } from "node:crypto";
import { payments } from "@/lib/payments/runtime";
import { paymentConfig } from "@/lib/payments/config";
import { reconcilePayments } from "@/lib/payments/reconcile";
import {
  queueOrderNotification,
  recoverOrderNotifications,
} from "@/lib/payments/notifications";
import { operations, mailConfigured } from "@/lib/operations/runtime";
import { drainMail, sendWithResend } from "@/lib/operations/mail";
import { json } from "@/lib/operations/http";

export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const received = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret || ""}`);
  if (
    !secret ||
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  )
    return json({ error: "Unauthorized" }, 401);
  try {
    const reconciliation = {
      checked: 0,
      updated: 0,
      manualReviewRequired: 0,
      failed: 0,
    };
    for (const mode of ["test", "live"] as const) {
      try {
        paymentConfig(mode);
      } catch {
        continue;
      }
      const { stripe, store } = payments(mode);
      const result = await reconcilePayments(
        stripe,
        store,
        (event) => queueOrderNotification(event, store),
        10,
      );
      for (const key of Object.keys(
        reconciliation,
      ) as (keyof typeof reconciliation)[])
        reconciliation[key] += result[key];
    }
    const ops = operations();
    await recoverOrderNotifications();
    const mail = mailConfigured()
      ? await drainMail(ops, sendWithResend)
      : { disabled: true };
    await ops.pool.query(
      `DELETE FROM simbiat_operations.rate_limits WHERE expires_at < now()-interval '1 day'`,
    );
    return json(
      { reconciliation, mail },
      reconciliation.failed || ("failed" in mail && mail.failed) ? 503 : 200,
    );
  } catch {
    return json({ error: "Maintenance incomplete; retry later." }, 503);
  }
}
