export type PaymentMode = "test" | "live";

export function paymentMode(): PaymentMode {
  const mode = process.env.STRIPE_PAYMENT_MODE || "test";
  if (mode !== "test" && mode !== "live")
    throw new Error("Invalid payment mode");
  return mode;
}

export function paymentConfig(mode: PaymentMode = paymentMode()) {
  const live = mode === "live";
  const key =
    (live ? process.env.STRIPE_API_KEY : process.env.STRIPE_SECRET_KEY) ?? "";
  const webhookSecret =
    (live
      ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
      : process.env.STRIPE_WEBHOOK_SECRET) ?? "";
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const origin = new URL(process.env.APP_URL || "http://localhost:3000");
  if (
    !(live ? /^(sk|rk)_live_/ : /^(sk|rk)_test_/).test(key) ||
    !webhookSecret.startsWith("whsec_") ||
    !databaseUrl ||
    (origin.protocol !== "https:" &&
      !(
        origin.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(origin.hostname)
      ))
  )
    throw new Error(
      live
        ? "Stripe live configuration is incomplete."
        : "Stripe sandbox configuration is incomplete. Live keys require explicit live mode.",
    );
  if (live && origin.protocol !== "https:")
    throw new Error("Live checkout requires HTTPS");
  return {
    key,
    webhookSecret,
    databaseUrl,
    origin: origin.origin,
    mode,
    live,
    schema: live ? "simbiat_checkout_live" : "simbiat_checkout_test",
  };
}

export function checkoutEnabled() {
  if (process.env.STRIPE_CHECKOUT_ENABLED !== "true") return false;
  try {
    paymentConfig();
    if (
      paymentMode() === "live" &&
      process.env.STRIPE_LIVE_TAX_READY !== "true"
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
