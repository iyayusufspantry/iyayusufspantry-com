import "server-only";
import Stripe from "stripe";
import { Pool } from "pg";
import { paymentConfig, type PaymentMode } from "./config";
import { PaymentStore } from "./store";

const globalPayments = globalThis as unknown as { paymentPool?: Pool };
export function payments(mode?: PaymentMode) {
  const config = paymentConfig(mode);
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
    store: new PaymentStore(pool, config.schema, { live: config.live }),
  };
}
