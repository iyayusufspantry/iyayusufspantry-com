import "server-only";
import Stripe from "stripe";
import { Pool } from "pg";
import { paymentConfig } from "./config";
import { PaymentStore } from "./store";

const globalPayments = globalThis as unknown as { paymentPool?: Pool };
export function payments() {
  const config = paymentConfig();
  const pool = (globalPayments.paymentPool ??= new Pool({
    connectionString: config.databaseUrl,
    max: 4,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  }));
  return {
    pool,
    config,
    stripe: new Stripe(config.key, { maxNetworkRetries: 2, timeout: 15000 }),
    store: new PaymentStore(pool),
  };
}
