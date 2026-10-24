# Client update received October 22, 2026

Current follow-up: the [October 24 email/image intake](client-feedback-2026-10-24.md) answers co-ownership/IRS readiness, accepts 4 PM Central Time, supplies the two homepage cover images, and changes egusi/ogbono/palm oil to **20 per size (40 per product)**. Use the [current stock intake](starting-stock-2026-10-24.json) and [October 24 unsent reply](simbiat-october-24-reply.md). The email's original date and appointment date are unverified; no new appointment is inferred. The [meeting transcript](client-meeting-2026-10-24.md) separately records later onboarding progress and the recipe decision. Matching pending questions below are historical.

Source: Simbiat's email text and snack collage supplied in the development chat. October 22 is the intake date; the original message's sent date has not been independently verified. This update supersedes the outstanding business-details, stock-count and initial-collage requests in the [October 16 record](client-feedback-2026-10-16.md).

## Confirmed information

- Simbiat says everything looks fine on her end. Record this as positive feedback on the current updates, without treating it as approval to launch live sales.
- Registered business: **Iya Yusuf's Pantry and Goods LLC**, an LLC. Keep **Iya Yusuf's Pantry** as the storefront brand.
- Business address: **7131 Limestone Cir, Manvel, Texas 77578**. Supplied for the business/account setup; it does not independently confirm a dispatch location, public collection address or walk-in premises.
- Business and customer support phone: **713-498-4010**. International format: **+1 713-498-4010**. WhatsApp use was not confirmed.
- Requested support address: **info@iyayusufspantry.com**. This is a mailbox setup request, not evidence that the inbox exists or receives messages.
- Simbiat confirms she is the person responsible for the account. Her full legal name, specific role, ownership percentage and any private Stripe verification details were not supplied; do not infer them.
- Starting quantity: **50 per product for now**. The [stock intake](starting-stock-2026-10-22.json) records product totals against the current approved catalog. No physical or sandbox inventory was changed.
- Illustrated recipes will take longer. No delivery deadline was given. Merchandise details and additional collages remain pending.

## Supplied collage

The image is headed **THE HANDS BEHIND OUR SNACKS** and signed **Iya Yusuf's Pantry**. It shows gloved snack preparation, a bucket of golden snack balls, orange-brown snack pieces, a woven drying tray and peanuts. These are editorial images; do not assign a specific product identity, location or producer name without confirmation.

The owner subsequently supplied the original file at `public/1792604044512blob.jpg` (1774 × 887), which has been visually inspected and matches the chat image. The published asset is attached to the existing sourcing article at `/blog/closer-to-the-source`; that article's photo also feeds its journal cards and homepage highlight. No replacement image is needed. The deployed article-hero presentation preserves the supplied image's aspect ratio so the complete collage remains visible on mobile and desktop. This applies to wide article images (ratio at least 2:1); existing portrait/landscape journal hero sizes and card/highlight thumbnail layouts are preserved.

## Implementation checks and prepared changes

Read the published Contentful catalog on October 22: **22 listings, 21 approved and one sample**. The sample Dried Ugu Leaves listing is excluded from stock intake. Egusi, Ogbono and palm oil each have two variants; **50 is the product total, not 50 per variant**. Their size allocation needs confirmation before live inventory is initialized. Single-variant product totals can be mapped when a separate live inventory configuration exists. This intake must not become a recurring reset of sold stock.

Contentful management access was restored on **October 23 (Asia/Makassar)** after the owner's retry instruction. The earlier requests returned HTTP 401; the successful retry used the saved `.env` token. Published the supplied collage, confirmed phone and three contact-copy entries after backing up affected records. A repeat preview reports `upload: false` and `changes: []`. No token value was printed.

`node scripts/contentful/october-22.mjs` previews the supplied collage, confirmed phone (`+1 713-498-4010`) and contact-copy changes; `--apply` publishes them. The script preserves other fields/locales, rejects editor drafts or unexpected current text, backs up affected entries and publishes using version checks. It leaves the email and WhatsApp values unresolved. The phone entry is `pantry-ref-9b11b471ae13f768851c5fc09b907900`; the published collage asset is `pantry-asset-27e7fba3622744c7ca86fad2`. The deployed Contact page makes a valid phone number a call link and removes its placeholder caption. The supporting copy explains which channels still need confirmation without inventing business hours or response promises. Removed explicit early `process.exit` calls after a completed preview triggered a Windows Node shutdown assertion; previews now exit naturally and succeed.

The final production build, TypeScript, targeted ESLint, formatting and whitespace checks passed. All 12 final local and public browser checks at 1440 and 390 pixels passed: correct image/phone on `/contact`, `/blog/closer-to-the-source`, `/blog` and `/`; full 2:1 collage; correct call link; no phone placeholder label, horizontal overflow or uncaught page errors; and original portrait/landscape hero sizing on `/blog/more-than-a-snack` and `/blog/rediscovering-the-taste-of-home`. Final mobile screenshots were visually inspected.

Application deployment completed on **October 23 (Asia/Makassar)** after the owner restored the existing project-owner Vercel login. Final deployment **`dpl_BZVccHdrXRnLbWM8SuYEQGNUvXZx`** built successfully, passed staged image/phone/portrait checks, and was promoted to `www.iyayusufspantry.com`. It supersedes `dpl_9VW2Wt1Ct8WPy3N4yXoNeLTSjBx1`, narrowing full-image sizing to wide article images. The standalone source package excluded environment credentials and Git metadata; critical application/dependency/payment configuration files matched validated local source. The existing project and domains were retained. Evidence is in ignored `artifacts/client-feedback-2026-10-22/`.

A read-only DNS check returned an existing MX record for `iyayusufspantry.com`: preference 10, `inbound-smtp.ap-northeast-1.amazonaws.com`. This establishes routing only; it does not prove an `info` inbox exists or identify the account managing it. Check the existing domain/receiving service and available email plan before changing routing or purchasing a service. Domain registration with Hostinger does not establish that a mailbox plan is active. Current Resend notification sending is separate from a customer support inbox. Keep the existing operational reply address until the new inbox is verified.

The owner clarified that email hosting is separate from website development; confirm any additional setup and subscription costs before proceeding. A hosted mailbox does not require building a mail server or acquiring a VPS. Hostinger documents checking the current plan under **Emails** in [its email-service guide](https://www.hostinger.com/support/5832752-how-to-check-the-email-service-included-in-your-hosting-plan-at-hostinger/). Check the existing account rather than assuming an included plan or quoting unverified prices.

## October 23 Stripe screenshot and email payment clarification

The owner supplied a screenshot of Stripe's **Tax details** step. It shows **Single-member LLC** selected, an empty **Employer Identification Number (EIN)** field and an empty **Legal business name** field. The example IRS letter and `00-0000000` are sample/placeholder content, not supplied business data. The business-type step is marked complete in the sidebar; the screenshot does not establish Stripe approval, correct ownership classification or completion of the later steps.

Confirm whether Simbiat is the only LLC owner before relying on the Single-member selection. Her earlier statement that she is responsible for the account does not establish sole ownership or tax classification. Have the applicable IRS tax documentation available to match the correct tax name and ID; do not automatically pair the storefront brand or supplied LLC name with an unverified tax ID. Stripe's [US tax-ID verification guidance](https://support.stripe.com/questions/tax-id-verification-guidelines-by-business-type-in-the-us) distinguishes business types and tax treatment. No tax election is inferred here. The reply arranges private tax/identity/payout-bank entry directly into Stripe during a review and retains the developer's responsibility for the remaining setup. No Stripe account was opened or changed by the agent; this is screenshot-based correspondence preparation only.

The owner also clarified that a paid custom-email plan needs funding. Check existing included email service first. If a subscription is needed, quote the actual price, billing period and renewal cost before agreement; the client can purchase it directly in her own account, or provide the agreed subscription payment before the developer orders it. Do not advance the developer's money or invent a price, payment link, extra build balance or approved setup fee. No subscription was purchased and no funds were requested through an external messaging tool. The unsent reply now explains these terms explicitly.

## Remaining actions

1. Collage/contact CMS publication, application deployment and final desktop/mobile public verification are complete. Obtain client review of the live updates; no further authentication or image file is needed for these changes.
2. Inspect the existing domain/email configuration, create or connect the requested inbox, and verify inbound mail and replies before publishing it or changing `EMAIL_REPLY_TO`/notification destinations. No email was sent during this intake.
3. Stripe work is deferred: the owner selected **site changes and reply draft only**. Preserve the confirmed LLC/address/phone/responsible-person facts for a separate onboarding task. Account verification, exact remaining requirements and live-sales readiness have not been checked here.
4. Confirm variant allocations for the three products above, then initialize real inventory only through the separate live implementation. Current payment code intentionally rejects live keys and live events.
5. Confirm shipping origin, coverage, packing time, shipping/tax/policy settings and final live checkout acceptance. The business address alone does not settle these decisions.
6. Agree the review time. The developer's proposal is Friday October 23 at 4 pm or 5 pm US Central Time; Simbiat has not accepted either time in this message. No appointment is booked.
7. Use the [new unsent reply](simbiat-october-22-reply.md) in place of the October 16 draft. Send only when instructed.

The CMS collage/contact updates and application layout/link changes are deployed and publicly verified. The stock intake is preparation only. Final mobile public screenshots were visually inspected. No mailbox creation, DNS change, Stripe submission, database stock update, purchase or appointment booking was performed.
