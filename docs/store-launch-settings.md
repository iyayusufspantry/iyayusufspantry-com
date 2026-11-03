# Store launch settings

November 3 update: Simbiat confirms that the business has **no active Texas sales-tax permit and no registrations in other states**. This supersedes earlier registration uncertainty. Public checkout remains test-only while required registrations and food/drink tax treatment are resolved. The new merch photos and M/L/XL/XXL shirt sizes are confirmed; merch prices, quantities and cap sizing are still missing. See [November 3 intake](client-feedback-2026-11-03.md).

October 31 implementation update: [live preparation](stripe-live-readiness-2026-10-31.md) now supports approved shipping, automatic tax, separate live inventory and verified webhook processing. Live stock is initialized from the October 24 24-variant/1,020-unit allocation without copying or resetting sandbox stock. Stripe Tax is active but registrations are empty; food/drink tax treatment and registration decisions remain for the business. Public mode stays `test` and `STRIPE_LIVE_TAX_READY=false`; no real customer purchases are enabled.

October 31 account update: [live API check](stripe-live-readiness-2026-10-31.md) confirms payments and payouts enabled with active card payments on the pantry live account. Requirements fields were not returned. The application remains sandbox-only; this account check neither enables website sales nor changes shipping/tax, inventory or webhook configuration.

October 24 email intake: the [current allocation](starting-stock-2026-10-24.json) confirms **20 per active size** for egusi, ogbono and palm oil (**40 per product**), replacing 50 total for those three. All other approved products remain 50 each; no live or sandbox stock was changed. The [email/image record](client-feedback-2026-10-24.md) also confirms co-ownership, IRS documentation readiness, developer mailbox-purchase permission with client funding, and acceptance of 4 PM Central Time. Exact mailbox terms/funding, account access, appointment date and live-sales readiness are not established by that email.

October 24 transcript intake: [meeting account and launch follow-ups](client-meeting-2026-10-24.md). Simbiat reports 50/50 ownership with her mother and completes further Stripe onboarding/identity steps during the recording. Final capabilities, payout setup, separate developer access and live checkout have not been independently checked. The code remains sandbox-only. She agrees to a basic mailbox in principle; confirm the exact term/renewal total and purchase/funding before setup. No completed mailbox purchase or delivery verification is evidenced. Paid recipes are paused by the later meeting discussion.

October 22 intake: [Simbiat's confirmed details](client-feedback-2026-10-22.md) supply the LLC, business address/phone and **50 per product**. The [stock intake](starting-stock-2026-10-22.json) is preparation for live inventory; size allocations remain pending for egusi, ogbono and palm oil, and no database stock was changed. The address has not separately been confirmed as the shipping origin. The requested `info@iyayusufspantry.com` inbox needs setup and verification before replacing the current reply destination. These facts supersede the matching missing-information statements below; shipping/tax and live implementation remain pending.

The owner requested US-only delivery and delegated reasonable starting defaults on 25 September 2026. These are working settings for the future live store. Current checkout remains a sandbox: no real charges or shipments, and shipping/tax remain $0 in test orders.

| Setting                  | Starting choice                                                                                             | Current status                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Currency                 | USD                                                                                                         | Implemented in sandbox checkout                                  |
| Destination country      | United States only                                                                                          | Enforced by Stripe Checkout                                      |
| Standard shipping        | $6.99; free for merchandise subtotals of $60 or more                                                        | Selected default; live totals not implemented                    |
| Processing estimate      | 1–3 business days                                                                                           | Draft; must reflect actual packing capacity before public launch |
| Transit estimate         | 3–7 business days after dispatch                                                                            | Draft; carrier/service still needed, not a guarantee             |
| International shipping   | Unavailable                                                                                                 | US-only checkout enforced                                        |
| Damaged/wrong items      | Contact support promptly with the order reference and photos; resolve by replacement or refund after review | Draft support workflow; final food-return policy needed          |
| Email provider           | Resend                                                                                                      | Configured; custom sender accepted by Resend's simulation        |
| Sender                   | `Iya Yusuf's Pantry <notifications@iyayusufspantry.com>`                                                    | Configured; delivery enabled                                     |
| Replies and owner access | Owner-supplied verified Gmail account                                                                       | Kept in private environment configuration                        |
| Contact submissions      | Protected owner-dashboard inbox                                                                             | Does not require outgoing email                                  |
| Maintenance              | Five-minute GitHub schedule plus daily Vercel backup                                                        | Immediate form email attempts plus scheduled recovery            |

There is no universal US sales-tax rate to fill in as a default. Before live checkout, supply the ship-from business address and the business's tax registrations/configuration. Tax collection and shipping totals must be calculated and validated on the server, and webhook amount checks must use the complete final total.

Sample stock must not become live stock automatically. Confirm real quantities, product prices, food/allergen descriptions, fulfillment coverage (including Alaska/Hawaii and PO boxes), and final business/policy details before enabling live sales. Live Stripe keys and live events remain rejected by the current implementation.

## Email setup

The Resend sending key is configured privately in Vercel and the local `.env`. The custom sender passed a test to Resend's simulated inbox. Email and newsletter flags are enabled; new form messages trigger a background delivery attempt, with GitHub Actions scheduled every five minutes for recovery. Provider acceptance is not a guarantee of real inbox delivery. The restricted sending key cannot inspect full DNS verification or delivery logs; use the Resend dashboard for those checks. Existing mailbox DNS records were not changed.

The notification sender is not an inbox. `EMAIL_REPLY_TO` routes customer replies to the owner's existing mailbox. Reply addresses are saved in the outbox payload so retries retain the exact original message. Contact notifications instead use the customer's submitted email as their reply address.
