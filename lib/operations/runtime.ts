import "server-only";
import { Pool } from "pg";
import { OperationsStore } from "./store";

const globalOperations = globalThis as unknown as { operationsPool?: Pool };
export function operations() {
  if (!process.env.DATABASE_URL) throw new Error("Database unavailable");
  const pool = (globalOperations.operationsPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  }));
  return new OperationsStore(pool);
}
export function siteOrigin() {
  const url = new URL(process.env.APP_URL || "http://localhost:3000");
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("Invalid website origin");
  return url.origin;
}
export function contactEnabled() {
  return (
    process.env.CONTACT_ENABLED === "true" &&
    !!process.env.DATABASE_URL &&
    !!process.env.FORM_SECRET &&
    !!(process.env.OWNER_CLERK_USER_IDS || process.env.OWNER_EMAILS)
  );
}
export function mailConfigured() {
  return (
    !!process.env.RESEND_API_KEY &&
    !!process.env.EMAIL_FROM &&
    process.env.EMAIL_DELIVERY_ENABLED === "true"
  );
}
export function newsletterEnabled() {
  return (
    process.env.NEWSLETTER_ENABLED === "true" &&
    !!process.env.DATABASE_URL &&
    !!process.env.FORM_SECRET &&
    mailConfigured()
  );
}
