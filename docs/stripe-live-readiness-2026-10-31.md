# Stripe live account check — October 31, 2026

November 3 update: Simbiat now explicitly confirms **no active Texas sales-tax permit or registrations in other states**. This supersedes the earlier unknown position below. See [current intake and official tax guidance](client-feedback-2026-11-03.md). Required active registrations and product tax treatment remain unresolved; public checkout stays in test mode. No Stripe configuration was changed by this follow-up.

## Current result after implementation

The live integration is now implemented and deployed to [the pantry website](https://www.iyayusufspantry.com). Deployment `dpl_2KjEbPgB5EKfiM4Va6qez221Vu52` is READY. **Customer purchases remain off pending confirmation of the business's tax registrations and product tax treatment.** The user answered “idk” when asked about registration; no registration or legal tax position has been invented. Public checkout deliberately remains in test mode.

- Prepared separate live orders/inventory in `simbiat_checkout_live`, with **24 approved variants and 1,020 units** from the October 24 allocation. Sandbox stock/orders are preserved. Live reservations never seed sample stock, and setup reruns never reset existing quantities.
- Added an explicit live configuration using `STRIPE_API_KEY`, a separate signing secret and a dedicated `/api/stripe/live-webhook` route. Both endpoints enforce their expected live/test mode after signature verification. Credentials are stored privately in Vercel and ignored local environment files.
- Registered live endpoint `we_1UWNqNHKfhrlO2yz4weufZPN`, pinned to the installed SDK's `2026-08-26.dahlia` event format, for checkout completion, asynchronous success/failure and expiration.
- Implemented the agreed **$6.99 shipping / free at $60 merchandise subtotal** rule server-side, US-only delivery and Stripe automatic tax. The current Stripe Tax configuration is active with a Texas head-office address, **zero tax registrations**, and a generic product tax default. Registration and food/drink classification must be confirmed before opening sales; a configured tax service alone does not establish the correct collection treatment.
- Payment confirmation validates merchandise subtotal, expected shipping, nonnegative integer tax, full final total, currency, zero discount, completed automatic tax, session identity and payment mode. Final shipping/tax/total amounts are saved for the owner workspace and receipts. Duplicate events cannot consume stock twice, and late payments after released reservations require review.
- Prepared live checkout/confirmation text, owner order/stock handling and live customer receipt rendering/queueing. Test-recipient restrictions remain for sandbox receipts. Scheduled reconciliation handles both configured modes, including old test sessions after a future mode switch.

### Production verification

Created **one unpaid live Checkout Session**, then immediately expired it through Stripe. No customer/card information was entered and no charge was made. Stripe delivered the genuine live expiration event to the deployed endpoint; the public status API returned `cancelled`, `pending_webhooks` reached **0**, and the test reservation returned to its exact original quantity. The cancelled audit order is retained. Evidence: ignored `live-smoke-result.json` in `artifacts/stripe-live-readiness-2026-10-31/`.

Unsigned requests to both webhook routes return **400**, the anonymous owner API returns **401**, and the public checkout remains **200 with test-mode wording**. A completed paid live card transaction and real customer receipt delivery have not been performed; the success path was tested against isolated temporary database schemas without charging a card or modifying real inventory.

Validation passed: production build/TypeScript; targeted ESLint and formatting; **14 payment tests, 11 operations tests, 4 email tests, 6 sandbox browser checks and 4 live-mode desktop/mobile browser checks**. Live-mode screenshots were inspected at 1440 and 390 pixels. The first live browser run caught an ambiguous test alert locator; it was scoped to the application alert and all four checks passed on rerun.

Vercel initially blocked a deployment because the local Git commit author lacks client-team membership. The authorized project account then deployed an isolated copy of the reviewed source without Git metadata, local environment files, client documents or output artifacts. No team permissions or deployment protections were weakened. The successful deployment uses the same application files as the checked workspace; subsequent edits are documentation and local tooling wording only.

### Completing launch after the tax decision

1. Obtain the business's actual collection registrations and food/drink tax treatment. Configure only confirmed facts in Stripe; do not register a tax obligation by assumption. Confirm the final delivery/dispatch/policy details against the material already supplied.
2. With those decisions resolved, set production `STRIPE_PAYMENT_MODE=live` and `STRIPE_LIVE_TAX_READY=true`, retain `STRIPE_CHECKOUT_ENABLED=true`, and redeploy. These gates are currently `test` and `false`. `LIVE_ORDER_EMAILS=true` is prepared; it queues only verified paid live orders.
3. Complete final live purchase/receipt acceptance with an authorized payer, then owner fulfillment review. No card transaction is authorized or represented as completed by the unpaid smoke check.

Repeatable tools: `npx tsx scripts/payments/live-setup.mts` previews live setup; `--apply` performs guarded, non-resetting preparation. `npx tsx scripts/payments/live-smoke.mts --apply` creates and expires an unpaid live session, leaving a cancelled audit record; it never submits a card. It is not a substitute for paid-order acceptance.

The earlier read-only findings below are retained as the before-state. In particular, the earlier **zero live endpoints** and **sandbox-only implementation** descriptions are superseded by the deployed preparation above.

## Initial read-only audit

The user explicitly directed use of `STRIPE_API_KEY` from the ignored `.env`. Used that key for a read-only Stripe `GET /v1/account` request through the installed SDK. No key was printed, copied into documentation or substituted into the application's sandbox configuration.

## Confirmed live account status

| Field                    | Result                  |
| ------------------------ | ----------------------- |
| Key mode                 | Live                    |
| Account                  | `acct_1UITMPHKfhrlO2yz` |
| Business                 | Iya Yusuf's Pantry      |
| Country / currency       | US / USD                |
| Details submitted        | `true`                  |
| Charges enabled          | `true`                  |
| Payouts enabled          | `true`                  |
| Card payments capability | `active`                |
| Transfers capability     | `active`                |
| Balance API mode         | `livemode: true`        |
| Live webhook endpoints   | `0`                     |

The live account currently has payments and payouts enabled. This supersedes earlier statements that live capabilities were uninspected or that only sandbox credentials were available. It provides no basis to ask Simbiat to repeat onboarding merely because the website is still using the sandbox.

The account response did not expose `requirements` or `future_requirements`; do not interpret absent fields as verified empty requirement lists or a guarantee that Stripe will never request further information. `cartes_bancaires_payments` was `pending`, while `card_payments` was `active`. Other methods were active; no capability was requested, changed or activated during this check.

## Expanded readiness check

At the user's follow-up request, rechecked the account and performed read-only balance and webhook-endpoint queries with the same live key. The balance request succeeded and explicitly returned `livemode: true`; no balance amounts were printed or saved. The fully paginated live webhook-endpoint query returned **zero endpoints**, so there is no live snapshot webhook configured for the website's current event-based order confirmation flow.

The public checkout returned HTTP 200 and visibly states **“Try a test checkout”**, **“Complete a sandbox purchase with Stripe. No real money will be charged or goods shipped.”** and **“Continue to Stripe — test payment.”** Vercel confirms the current production deployment is `dpl_uK9bPvBkAitYdrjeWss1G76mR8Ff` (READY), source commit `cd0ff3c9185a5c04d7e0a2b9e8f4cdc4464fc910`. This is the inspected sandbox-only payment implementation, not a newer live integration. The first public fetch timed out; an IPv4-first retry succeeded.

**Result: the Stripe account is enabled for live card payments and payouts; the storefront is not ready for live sales.** Remaining barriers identified here are website implementation/configuration and the missing live webhook, rather than an observed account-level restriction on card processing. A successful real payment or payout has not been tested, and the API does not expose a complete verification task list for this account. No claim of final end-to-end launch acceptance is made.

Sanitized evidence is saved in ignored `artifacts/stripe-live-readiness-2026-10-31/account-and-webhooks.json` and `website-check.json`. These files contain account status, capability flags and public deployment/checkout findings; no API keys, bank details, balance amounts or customer/payment records were retained.

## Website work remains

The existing application still uses `STRIPE_SECRET_KEY` for its sandbox integration. Its configuration requires a test key, its webhook rejects live events and its payment store uses sandbox inventory/orders with test-only shipping/tax treatment. The authorized `STRIPE_API_KEY` is a separate live credential used for this account inspection; simply swapping keys would not complete the implementation.

Remaining work includes a separate live order/inventory configuration using approved stock, correct shipping/tax totals and payment reconciliation, live webhook configuration, the owner workflow and end-to-end checkout validation before launch. Review already supplied commercial settings and identify only specific unresolved decisions; do not require the client to work through unrelated subscriptions, Treasury or invoice setup guides.

No live Checkout Session, payment, refund, payout, bank change, webhook endpoint, product or tax registration was created or modified. No application code, deployment environment or public checkout mode was changed. No email was sent. The [unsent client reply](simbiat-october-30-reply.md) now states the enabled account status while keeping website integration/testing pending.
