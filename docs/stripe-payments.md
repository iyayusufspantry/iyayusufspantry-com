# Local Stripe sandbox checkout

The app has a test-only Stripe-hosted checkout, PostgreSQL order/stock persistence, and a signed webhook at `POST /api/stripe/webhook`. Live keys and live events are rejected. Shipping and tax are explicitly $0 **for sandbox testing only**. Nothing in this change enables live sales.

## Start locally

Keep the existing Contentful and Clerk environment settings. Configure these server-only values in `.env`:

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
```

The webhook secret in `.env` is for the destination registered in the Stripe Dashboard. Never commit credentials. A publishable Stripe key is not needed for this hosted redirect flow.

```bash
corepack pnpm install --frozen-lockfile
npm run payments:setup
npm run operations:setup
npm run payments:dev
```

`payments:setup` verifies the test account and creates only the `simbiat_checkout_test` schema and its tables in the configured database. It does not replace existing tables or reset stock. The supplied database may be hosted remotely even though the app runs locally.

`payments:dev` starts Next.js on **http://localhost:3000** and Stripe CLI forwarding to **http://localhost:3000/api/stripe/webhook**. It uses the test API key without putting it in command-line arguments. It writes the CLI signing secret, `STRIPE_CHECKOUT_ENABLED=true`, and `APP_URL=http://localhost:3000` to Git-ignored `.env.local`, preserving the Dashboard secret in `.env`. Output hides the signing secret. Stop any other server using port 3000 first. Keep this command running while testing; the public Dashboard destination cannot deliver to localhost.

Visit `/checkout`, load a sample cart, then click **Continue to Stripe — test payment**. Enter fictional details with a US address, card **4242 4242 4242 4242**, any future expiration, and a three-digit CVC. Stripe sends its event to the local listener. The confirmation screen waits for the database status to become paid; the redirect alone cannot mark an order paid.

Email is off by default. Optional test receipts can only go to explicitly configured recipients. The protected `/owner` dashboard can now inspect saved sandbox orders, record test fulfillment, and edit reserved-stock-aware inventory. The public prototype owner page remains sample-only. See [Store operations](operations.md) for owner and email configuration. Do not enter actual customer details during testing.

If another app uses port 3000, run `npm run payments:dev -- 3002` and open `http://localhost:3002/checkout`. The launcher updates local forwarding and return URLs to match the selected port.

In PowerShell, paste only the command itself, such as `npm run payments:dev -- 3002`. The triple backticks and `bash` label in documentation are formatting, not commands. If this project's Next.js server is already running, the launcher prints its URL and exits before changing `.env.local` or starting another listener. Use that URL, or press Ctrl+C in the terminal running the original command before restarting.

## Implemented flow

- `/api/checkout/session` validates JSON, bounds body size, requires the configured browser origin, applies persistent request limits, fetches authoritative published prices, and reserves sandbox stock in a database transaction. Browser prices are rejected. Run `operations:setup` for the rate-limit table and local `FORM_SECRET`.
- A random request ID is reused after network errors and page reloads. The immutable order snapshot stores exact Stripe parameters. Database locking and Stripe idempotency prevent duplicate reservations and sessions for that request.
- Each variant gets sample stock only on its first sandbox reservation. Concurrent reservations lock stock rows in a consistent order. Successful payment consumes stock exactly once.
- `/api/stripe/webhook` verifies the signature against the **raw** request body. It checks test mode, integration/order/session references, payment status, amount, and currency. Event IDs and payment IDs are unique; database failures return an error so Stripe can retry.
- `checkout.session.completed` with an unpaid status stays pending. `checkout.session.async_payment_succeeded` records payment; `checkout.session.async_payment_failed` and `checkout.session.expired` release pending reservations. Later failure/expiration events do not undo paid orders. Payment after a released reservation becomes `review` without deducting stock again.
- `/api/checkout/status` returns only status, order reference, currency, and total using an unguessable Stripe Session ID. It never returns customer or shipping details and is not cached.
- Checkout sessions expire after one hour. Returning via Stripe's back button retains the open session so it can be resumed. Stock is released when expiration is confirmed, not merely when the browser navigates away.

## Tests and recovery

```bash
npm run payments:test
npm run build
npm run payments:test-ui
# With payments:dev running in another terminal:
npm run payments:smoke
npm run payments:test-purchase
# Explicitly test the canonical deployed sandbox:
npm run payments:test-purchase -- --public
npm run payments:reconcile
```

Database tests use a uniquely named temporary schema and remove only that schema. They cover signature rejection, concurrent reservations, duplicate callbacks, changed carts, payment mismatch, unpaid/failed/expired sessions, and late payment review. Browser tests cover desktop/mobile retry behavior and webhook-driven confirmation. The default prototype browser suite explicitly disables sandbox checkout.

The smoke check creates a real **test** Checkout Session, verifies idempotent retry, expires it, and checks that the actual Stripe event reaches the local webhook. It creates no charge and leaves a cancelled sandbox order as evidence.

`payments:test-purchase` opens Stripe's hosted form in Chromium, submits fictional delivery details and the standard test card, and waits for the webhook-confirmed paid screen. It leaves a paid sandbox order and consumes sample stock. This complete flow passed locally on 24 September 2026, as did the expiration smoke check, eight transaction/security tests, six browser checks, and the production build.

Reconciliation checks up to 100 pending orders against Stripe and rotates checked records so unresolved old orders cannot starve later ones. It can recover missed payment/expiry events and incomplete session linking. Uncertain session creation is replayed with identical parameters and the original idempotency key only within 23 hours; older unlinked orders are reported for manual review and remain reserved. A failed create with no Stripe session may also need manual review. The protected maintenance endpoint is implemented; a scheduler still needs deployment configuration. See [Store operations](operations.md).

## Later deployment

The deployed public endpoint is `https://www.iyayusufspantry.com/api/stripe/webhook`. Its test destination now subscribes to these four **snapshot** events from **Your account**:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
```

For a deployed sandbox, set the public `APP_URL`, test key, database URL, `FORM_SECRET`, `STRIPE_CHECKOUT_ENABLED=true`, and the **Dashboard endpoint's** signing secret in Vercel. Initialize both schemas. Do not copy the local CLI secret into Vercel. Deploy the implementation before testing remote delivery. Without the feature flag, checkout retains the prototype UI, while the webhook remains available to process existing sandbox orders. Run `npm run operations:check -- --public` to check the deployed flag, protected route, and signing-secret match.

Before live sales: approve real prices, shipping destinations/rates and tax settings; implement a separate live order/inventory configuration; configure the owner allowlist, sender, scheduler, and operational monitoring; and complete live-account verification and end-to-end acceptance testing. The implemented owner tools, email queue, and rate limits currently support the sandbox flow. Replacing the test key with a live key intentionally does not enable live checkout.

References: [Stripe Checkout](https://docs.stripe.com/checkout/quickstart), [webhook verification](https://docs.stripe.com/webhooks), [local forwarding](https://docs.stripe.com/cli/listen).
