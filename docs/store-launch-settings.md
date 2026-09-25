# Store launch settings

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
