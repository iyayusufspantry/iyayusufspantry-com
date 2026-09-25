import "server-only";
import { after } from "next/server";
import { mailConfigured, operations } from "./runtime";
import { drainMail, sendWithResend } from "./mail";

// The committed outbox remains the source of truth. This attempts prompt
// delivery; the scheduled worker recovers failures and interrupted requests.
export function dispatchMailAfterResponse() {
  if (!mailConfigured()) return;
  after(async () => {
    try {
      const result = await drainMail(operations(), sendWithResend, 3);
      if (result.failed)
        console.error("Email delivery pending; scheduled worker will retry.");
    } catch {
      console.error("Email worker unavailable; saved messages remain queued.");
    }
  });
}
