# Internal estimate basis — not a client attachment

Updated 16 September 2026. The current two-page proposal and email use a **negotiable US$1,000 opening fee**, with **50%/50% payments based on the final agreed fee**. Zulzidan expressly wants the price open to discussion. US$1,000 was selected from the earlier draft range as a starting offer, not a final commitment. Simbiat has not accepted it. Earlier estimate PDFs are historical, not the current offer. Stripe and the **Amber and John / WaistLess Foods original $700 project** remain the technical and referral context.

## Evidence reviewed

- The supplied terminal paste identifies `C:/Users/MSI/code/waistlessfoods`. It is a directory listing, not a proposal or payment record.
- [WaistLess internal pricing notes](../../waistlessfoods/docs/proposal/internal-pricing-and-scope-notes.md) record the original $700 website package and describe relationship-based pricing. Later add-on prices are separate from that original package.
- [Original scope versus delivered audit](../../waistlessfoods/docs/proposal/original-scope-vs-delivered-audit.md) records $700, 30%/30%/40% milestones, and a four-to-six-week estimate. Its approximate $1,000 overall investment is expressly unverified against payment records. Do not present that as the original fee or confirmed payments.
- The audit describes a much longer engagement with extensive revisions and expanded administration, content, order, and email work. This supports clearer launch limits, not charging Simbiat for another client's scope history.
- The package manifest, database adapter/schema, Stripe configuration, checkout route, and order-system documentation show Next.js, Stripe, Contentful, Neon/Postgres with Drizzle, and Clerk. The checkout code inspected handles recipes and cooking classes; the orders schema requires a user ID. Simbiat needs guest checkout and physical-product stock/shipping. This is a useful reference, not a drop-in physical store backend. No production behavior was tested.

## Commercial position

The earlier $2,300–3,000 draft assumed $20/hour, 100–130 hours, and contingency. That was not Zulzidan's supplied rate and did not incorporate the referral history. It is superseded as the proposed selling price. Choosing Stripe does **not** itself eliminate backend work or make a production store cheaper.

- Current proposed referral fee: **$1,000, open to discussion**, replacing the previous $700–1,000 range.
- The proposed fee covers the documented launch package, supplied content, and bounded workflows. Agree the final fee, stock, tax, shipping, and editing rules before accepting the proposal; additions require a separate quote.
- This is a commercial concession, not a market-rate claim, a new hourly estimate, or evidence that the production work only costs $700. Do not invent a higher normal price or discount percentage.
- Another client's dollar amount, payment history, and scope problems stay out of Simbiat's email/PDF. It is enough to say the proposal takes the referral into account.
- **Neither $700 nor $1,000 is already approved for Simbiat.** The current draft makes one concrete $1,000 offer for review. Any change to that offer must be reflected in both the proposal and email before agreement.
- Preserve two revision rounds, 30 days of defect support, capped initial content, and separate quotes for additions. Payment verification, stock correctness, and access protection are part of the promised build.
- Proposed payments: **50% of the agreed fee to begin, and 50% after final review/approval, before launch**. Do not lock installments to $500 while the price is negotiable, or import WaistLess's different milestone schedule.
- Proposed delivery: **4–6 weeks**, subject to content, availability, reviews, and account setup. The approximately one-month discovery discussion was not a guaranteed deadline.

## Stripe implementation scope

Include server-validated prices and quantities, Stripe-hosted Checkout, verified signed webhooks, durable orders, duplicate-event protection, and confirmation that does not depend on a browser redirect alone. Follow [Stripe's fulfillment guidance](https://docs.stripe.com/checkout/fulfillment).

Physical goods add stock deduction, concurrent-purchase protection/reservation and release behavior, shipping addresses, one flat shipping zone, and manual fulfillment status. Confirm how cancelled/expired sessions and refunds affect stock. Basic stock control is included; multiple warehouses, automated carriers, advanced reporting, and workflow builders are excluded.

One protected owner screen covers orders and stock; product/editorial entry uses a CMS. Refunds use Stripe's dashboard. Customer accounts, self-service returns, paid recipes, subscriptions, and historical migration are excluded. Configure agreed Stripe tax settings using client-supplied requirements; automatic tax fees are separate. Do not substitute an arbitrary blanket tax rate.

Existing work informs the approach. Any code reuse must be suitable and permitted; no client data, credentials, branding, or private content should cross projects. No copying, purchases, production setup, or changes to WaistLess Foods occurred during this estimate revision.

## Supporting services and running costs

Zulzidan's requested direction is **Stripe + Vercel + Contentful + Neon Free (Supabase Free as an alternative) + Gmail SMTP with a Google app password**. Resend, Sanity, and the assumed Supabase Pro subscription are removed. The user confirmed Contentful would be a **new Free account**; do not continue to assume an existing commercial or legacy entitlement.

| Service                         | Launch cost basis                              | What is established                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neon Free                       | $0 within quotas                               | Starter database, not the paid Launch plan. See [Neon's free-plan guide](https://neon.com/blog/how-to-make-the-most-of-neons-free-plan). Validate storage, compute, transfer, and recovery needs.                                                                                                                                                                                                        |
| Supabase Free, alternative only | $0 within quotas                               | Do not charge for both databases. [Pricing](https://supabase.com/pricing) describes free-project inactivity pausing and limits; do not assume paid backup features are included.                                                                                                                                                                                                                         |
| Gmail SMTP                      | $0 additional subscription with consumer Gmail | Nodemailer connects directly to Gmail using an eligible account's app password. This replaces Resend; an app password is not a Resend credential. Existing Workspace subscriptions or a branded mailbox can have separate charges.                                                                                                                                                                       |
| Vercel                          | Production cost not waived by new login        | [Hobby terms](https://vercel.com/docs/plans/hobby) limit free use to personal, noncommercial projects. A new Gmail login does not change this. Pro starts at $20/month before usage and additional seats; [pricing](https://vercel.com/pricing).                                                                                                                                                         |
| Contentful                      | New Free account: development only             | [Current usage terms](https://www.contentful.com/help/admin/usage/usage-limit/) prohibit commercial use of the current Free plan. User confirmed a new account, so legacy terms cannot be assumed. A suitable production plan or a later CMS change is needed before launch. [Published Lite pricing](https://www.contentful.com/pricing/) is $300/month; this is a reference, not an approved purchase. |
| Stripe standard payments        | No standard monthly fee                        | US domestic cards 2.9% + $0.30 per successful transaction; [pricing](https://stripe.com/pricing). Additional services and other payment methods have separate pricing.                                                                                                                                                                                                                                   |

Prices and terms checked 16 September 2026. Keep Contentful as requested; do not silently replace it with another CMS. The new Free account can be used for development, but cannot establish a $0 commercial production budget. No account or provider purchase has been made.

The exact current Neon pricing page could not be opened by the browser tool. Its official free-plan guide supports the $0 starter assumption. Verify the actual account quotas before deployment; do not claim a complete paid-plan comparison from an unavailable page.

## Gmail sending and database implementation

Use Nodemailer and Gmail SMTP, not Resend. Google requires [2-Step Verification to create app passwords](https://support.google.com/accounts/answer/185833); availability depends on account settings. A Google password change revokes app passwords. The client enters the credential through the deployment secret settings; never place it in source, the PDF, or chat.

Use the authenticated Gmail sender with customer addresses in Reply-To for inquiries. A Google app password does not create a custom-domain mailbox. Confirm allowed sender identities and test real inbox delivery before launch. Follow [Google's sending-limit guidance](https://support.google.com/mail/answer/22839); limits and anti-abuse checks can temporarily stop mail. This budget covers low-volume order/contact messages, not bulk newsletters.

Order persistence and payment status must not depend on successful SMTP delivery. Include failure logging and a bounded retry/resend process, avoiding duplicate confirmations from repeated Stripe webhooks. The protected owner order screen remains the operational record.

Neon replaces the paid database assumption, not owner authentication or the order/stock implementation. Price the required protected sign-in, authorization, order records, stock correctness, and recovery setup within the build. Choose the owner-auth approach and any account limits before the fixed quote. Free database tiers do not imply unlimited storage or production recovery guarantees.

## Cost presentation

- Current proposed build fee: **$1,000, negotiable**; two installments of **50% of the agreed fee**. Hosting/CMS decisions and the final fee must be resolved before requesting the deposit.
- Domain remains a **$20–30/year allowance**, to check against the existing renewal.
- Starter database and Gmail SMTP can have **$0 subscription cost within their limits**.
- The prior **$45–65 monthly estimate and annual totals are superseded**. They priced different services and must not remain in the active client draft.
- The requested new-account stack is **not established as $0/month in production**. Hosting and the Contentful production plan must be settled before a complete running-cost quote.
- Published paid-plan comparison only: Vercel Pro $20 + Contentful Lite $300 = **$320/month**, before optional support, tax, usage, and other charges. That is $3,840/year for those two subscriptions; no such purchase or plan change is authorized. It explains why the requested Free plans cannot honestly be advertised as a finished low-cost production solution.
- Optional maintenance remains **$60/month for up to two hours**, after 30 days of included defect support. Extra approved work is proposed at **$30/hour**. It is not mandatory and is not part of a provider subscription.
- Eleven paid maintenance months would cost $660; twelve would cost $720. Do not present a first-year grand total while production-plan choices remain unresolved.
- Stripe processing/Tax fees, postage, taxes, additional usage, paid upgrades, and extra work are separate. Services can begin billing during development.

If the paid Contentful cost does not fit the budget, explain the conflict and discuss a different eligible CMS or pricing arrangement. Do not purchase anything, silently swap the requested CMS, or pretend a new email account changes provider restrictions. Nothing is blocked about preparing the draft; only the final production-cost decision remains open.

## The $9 Shopify question

The current [Pause and Build plan](https://help.shopify.com/en/manual/online-store/shopify-vacation-setting) is $9/month but disables checkout and purchases. The older [Lite plan](https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/shopify-lite-plan) is unavailable to new stores. [Developer stores](https://shopify.dev/docs/apps/build/stores/development-stores) are for testing and cannot process real transactions or operate as production stores. None supplies a $9 live production assumption for this Stripe estimate. Which historical plan the user remembers remains uncertain.

## Files and regeneration

- Current proposal for review: `docs/simbiat-website-proposal.html`, `docs/simbiat-proposal-email.md`, and `artifacts/pdf/Simbiat-Website-Proposal.pdf`. Regenerate with `node scripts/export-proposal-pdf.mjs`. The current version is two pages, uses the negotiable $1,000 opening fee, and keeps production hosting/CMS costs explicit and unresolved. Use the proposal email for the current client review; earlier estimate files remain historical references.

## Format decision after reviewing Amber's original PDF

Reviewed the eight-page [WaistLess Foods proposal from September 2025](WaistLess-Foods-Website-Proposal-Sept-2025.pdf). Its executive summary, business context, positioning, and collaboration sections explain the broader strategy. They are useful when the client is deciding what the project should be. Simbiat has already affirmed the scope and prototype, so her current decision is the package, fee, and ongoing costs. Keep the two-page format and bring over a brief personalized business introduction and clear review updates by email.

Avoid repeating the older proposal's scope ambiguity. Page 7 includes both a basic recipe hub with no filters and a full hub with filters; it also combines basic logins with no payments yet and Stripe sales/bookings. The current proposal should have one bounded launch package and one negotiable opening fee. The price and payment language must match the email. The original PDF remains unchanged.

- Client source: `docs/simbiat-initial-estimate.html`.
- Client email: `docs/simbiat-estimate-email.md`.
- Regenerate: `node scripts/export-estimate-pdf.mjs`.
- Output: `artifacts/pdf/Simbiat-Initial-Website-Estimate.pdf`, portable HTML, and page proofs.
- The original proposed scope stays the historical review attachment. This revised estimate records the Stripe direction and new commercial assumptions. Nothing has been sent.
