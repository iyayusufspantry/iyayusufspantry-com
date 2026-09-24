import nextEnv from "@next/env";
import { Pool } from "pg";
import Stripe from "stripe";
import { paymentConfig } from "../../lib/payments/config";
import { PaymentStore } from "../../lib/payments/store";
import { reconcilePayments } from "../../lib/payments/reconcile";

nextEnv.loadEnvConfig(process.cwd());
const config = paymentConfig();
const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 10000,
});
try {
  const stripe = new Stripe(config.key, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
  const store = new PaymentStore(pool);
  const result = await reconcilePayments(stripe, store);
  console.log(JSON.stringify(result));
  if (result.failed) process.exitCode = 1;
} catch {
  console.error(
    "Reconciliation failed. Check Stripe/database connectivity and retry. Reservations were not released without provider confirmation.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
