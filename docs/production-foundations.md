# Production foundations — milestone 01

Status: implemented and tested locally with sample records. The initial payment has been received; launch still depends on client materials and service access. The existing proposal remains the commercial source of truth.

## What works now

The browser cart now uses Zustand, created once per root client provider rather than as a mutable module singleton. The provider shares a stable store reference; components use selectors for items, readiness, counts, totals, or individual actions. Session storage is restored after hydration with `skipHydration`, preserving the original raw-array format and storage key. Only validated product selections persist. See [Zustand's Next.js guidance](https://zustand.docs.pmnd.rs/learn/guides/nextjs) for the provider/store pattern. This does not move prices, stock authority, customer data, or orders into browser state.

| Area                | Implementation                                                                                                              | Boundary                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Catalogue           | Explicit variant IDs, size/dietary choices, active flags, USD prices in integer cents                                       | Sample prices still require approval                                                                   |
| Cart                | Validated restoration, duplicate merging, shared variant pricing                                                            | Browser estimates are never trusted by the server                                                      |
| Cart review         | `POST /api/cart/review` recalculates merchandise prices and checks stock                                                    | Uses fixed sample stock; no reservation or order is created                                            |
| Order rules         | Reserve, record payment, cancel reservation, fulfill, adjust stock                                                          | Pure functions; not persistent, authenticated, or safe across concurrent server requests by themselves |
| Owner workspace     | `/prototype/owner` filters orders, marks paid samples fulfilled, cancels unpaid reservations, and edits stock               | Public demonstration with fictional records only; changes reset on refresh                             |
| Content preparation | Existing product/editorial samples plus [content model](content-model.md) and [product intake template](product-intake.csv) | Contentful is not connected                                                                            |

## Layout of the implementation

- `data/product-variants.json`: explicit sample commercial variant records. Stable IDs are currently `product-slug:Size:Dietary`; once real inventory exists, do not change IDs when renaming display labels.
- `lib/commerce/catalog.ts`: selection validation and integer-cent quote calculation. Browser and server can share pure calculations; the API independently supplies its own catalogue and stock.
- `lib/commerce/orders.ts`: immutable order and stock transitions. Failed transitions leave the input state unchanged.
- `lib/commerce/sample.ts`: development fixture factory; never a production repository.
- `app/api/cart/review/route.ts`: bounded JSON request parsing and safe public errors.
- `components/cart-review.tsx`: review loading, success, error, timeout, and retry behavior. Replacing the cart remounts the review and discards stale results.
- `components/owner-preview.tsx`: component-memory workspace using the same stock and fulfillment rules tested in isolation.

The site retains its prototype notices and no-index metadata. `/scope` and the proposal artifacts preserve the earlier scope presentation; they are not the current implementation status. This document and the development log track implementation.

## Review API

```json
{
  "items": [{ "variantId": "classic-chin-chin:Large:Vegan", "quantity": 2 }]
}
```

Send `Content-Type: application/json`. Only `items` is accepted at the top level; items contain only `variantId` and `quantity`. There are at most 50 incoming lines, each quantity is a whole number from 1 to 99, duplicate variant quantities are combined before availability checks, and the body is limited to 16 KiB including streamed bodies. Contact/address details and client-supplied prices are rejected.

The sample response has `subtotalCents: 3200`, `currency: "USD"`, `mode: "sample"`, and `paymentEnabled: false`. `shippingCents`, `taxCents`, and `totalCents` are `null`, never silently treated as zero. Responses use `Cache-Control: no-store`. Invalid input returns 400, unavailable variants/stock return 409, oversized bodies return 413, unsupported media types return 415, and unexpected failures return 503 with a generic message. No customer input is logged by this handler.

This is a read-only quote review, not checkout. It does not reserve stock and cannot guarantee availability by the time a customer pays. The owner preview has independent in-memory stock; its edits do not alter these fixed API fixtures.

## Order and inventory rules

1. Reserve every order line together, after resolving catalogue prices and checking aggregate quantities against available stock (`onHand - reserved`).
2. Pending orders hold stock. Cancelling a pending order releases its reservation exactly once. Paid orders cannot use this cancellation path.
3. Recording a matching payment consumes on-hand stock and releases reserved stock exactly once. Repeating the same payment on the same paid/fulfilled order is a no-op. A payment ID cannot pay two orders.
4. Only paid orders can be fulfilled. Repeated fulfillment is a no-op.
5. Owners cannot reduce on-hand stock below reserved units; quantities must remain whole and bounded.
6. Payments arriving after cancellation are rejected by the current state machine and require an integration-level reconciliation/refund process. There is no silent stock deduction or resurrection of cancelled orders.

`recordPayment` is a domain function, not a webhook handler. Its current matching amount is a **sample merchandise subtotal only**. Before a real payment adapter is attached, extend the stored order snapshot to include approved shipping and tax and match the final provider amount/currency. Do not invoke this function directly with unverified browser or webhook input.

## Integration work before real transactions

| Dependency               | Required implementation / decision                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transactional storage    | Choose and price the service; persist variants, stock, orders, order lines, reservations, payments, webhook events, fulfillment history, and email outbox                          |
| Concurrent stock changes | Execute each transition in one database transaction using row locks or atomic conditional updates; unique order IDs, payment IDs, and webhook event IDs; rollback on any failure   |
| Reservation lifecycle    | Store creation/expiry times and payment-session links; release abandoned reservations through an idempotent job; reconcile late payments                                           |
| Owner access             | Client-owned identity, one approved owner, server-side session/authorization checks for every order read and stock/order mutation; preview is not an admin endpoint                |
| Stripe                   | Client account access/verification, test credentials, hosted checkout, signed webhooks, server-side totals, idempotency, paid/cancelled/failed session handling and reconciliation |
| Contentful               | Client-owned space/environment, content types, sample import and then approved content, server-only access credentials, published-content validation and revalidation              |
| Email                    | Client-owned sender/inbox, order email outbox, retry/deduplication, contact form validation and abuse controls                                                                     |
| Shipping and tax         | Confirm served states, one flat-rate shipping zone/rate, excluded products/destinations, and approved Stripe tax settings                                                          |
| Launch                   | Approved brand/products/policies, hosting/domain, backups and recovery, real integration tests, owner training and final review/payment under the proposal                         |

Content management should own editorial copy and media. Transactional storage must own reservations and orders. Decide a single authoritative source and synchronization process for commercial prices/stock before importing real products. Do not use published CMS content as a concurrent inventory ledger.

No hosting/content service has been purchased and no live payment credentials are needed for this milestone.

## Validation and screenshot workflow

```bash
npm run lint
npm run type-check
npm run format:check
npm run build
npm test
node scripts/screenshot-index.mjs
npm run export:foundations
npm run archive:milestone -- 01-foundations after
```

The full test suite captures all screens at 1440px desktop and 390px mobile, plus reviewed-checkout and updated-owner states. For screenshot-only refreshes use `npm run screenshots`. The screenshot suite includes automated accessibility, horizontal overflow, console errors, and route checks. Browser tests run against the production build on port 3100; use a free port/no stale server when validating a new build. Automated accessibility is not a substitute for manual review.

The milestone archive refuses to overwrite an existing stage, copies current screenshots, documentation, and the progress PDF, and records SHA-256 hashes. Use a new stage name for subsequent iterations. `artifacts/` is Git-ignored; retain or share milestone archives separately from source control. Keep source documentation in `docs/` and record results in [development-log.md](development-log.md) after each milestone.
