# Store launch settings

The owner requested US-only delivery and delegated reasonable starting defaults on 25 September 2026. These are working settings for the future live store. Current checkout remains a sandbox: no real charges or shipments, and shipping/tax remain $0 in test orders.

| Setting                  | Starting choice                                                                                             | Current status                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Currency                 | USD                                                                                                         | Implemented in sandbox checkout                                          |
| Destination country      | United States only                                                                                          | Enforced by Stripe Checkout                                              |
| Standard shipping        | $6.99; free for merchandise subtotals of $60 or more                                                        | Selected default; live totals not implemented                            |
| Processing estimate      | 1–3 business days                                                                                           | Draft; must reflect actual packing capacity before public launch         |
| Transit estimate         | 3–7 business days after dispatch                                                                            | Draft; carrier/service still needed, not a guarantee                     |
| International shipping   | Unavailable                                                                                                 | US-only checkout enforced                                                |
| Damaged/wrong items      | Contact support promptly with the order reference and photos; resolve by replacement or refund after review | Draft support workflow; final food-return policy needed                  |
| Email provider           | Resend                                                                                                      | Adapter implemented; account key and sending-domain verification needed  |
| Sender                   | `Iya Yusuf's Pantry <notifications@iyayusufspantry.com>`                                                    | Prepared, sending disabled                                               |
| Replies and owner access | Owner-supplied verified Gmail account                                                                       | Kept in private environment configuration                                |
| Contact submissions      | Protected owner-dashboard inbox                                                                             | Does not require outgoing email                                          |
| Maintenance              | Daily at 05:00 UTC on current Vercel Hobby plan                                                             | Sandbox recovery backup; frequent worker needed before email/live launch |

There is no universal US sales-tax rate to fill in as a default. Before live checkout, supply the ship-from business address and the business's tax registrations/configuration. Tax collection and shipping totals must be calculated and validated on the server, and webhook amount checks must use the complete final total.

Sample stock must not become live stock automatically. Confirm real quantities, product prices, food/allergen descriptions, fulfillment coverage (including Alaska/Hawaii and PO boxes), and final business/policy details before enabling live sales. Live Stripe keys and live events remain rejected by the current implementation.

## Email setup

Create a Resend account, save its API key as `RESEND_API_KEY` in the ignored local `.env`, and verify the sending domain with the DNS records Resend supplies. Do not replace existing mailbox MX records merely to configure outbound notifications. Configure a frequent worker, then verify delivery before enabling `EMAIL_DELIVERY_ENABLED` and `NEWSLETTER_ENABLED` in production.

The proposed sender is not an inbox. `EMAIL_REPLY_TO` routes customer replies to the owner's existing mailbox. Reply addresses are saved in the outbox payload so retries retain the exact original message. Contact notifications instead use the customer's submitted email as their reply address.
