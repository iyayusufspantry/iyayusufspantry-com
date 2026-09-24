export function paymentConfig() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const origin = new URL(process.env.APP_URL || "http://localhost:3000");
  if (
    !/^(sk|rk)_test_/.test(key) ||
    !webhookSecret.startsWith("whsec_") ||
    !databaseUrl ||
    (origin.protocol !== "https:" &&
      !(
        origin.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(origin.hostname)
      ))
  )
    throw new Error(
      "Stripe sandbox configuration is incomplete. Live keys are not supported.",
    );
  return { key, webhookSecret, databaseUrl, origin: origin.origin };
}

export function checkoutEnabled() {
  if (process.env.STRIPE_CHECKOUT_ENABLED !== "true") return false;
  try {
    paymentConfig();
    return true;
  } catch {
    return false;
  }
}
