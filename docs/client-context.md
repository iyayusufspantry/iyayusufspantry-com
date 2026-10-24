# Client context

October 24 email/image intake: [confirmed allocations, time and covers](client-feedback-2026-10-24.md). Egusi, ogbono and palm oil are **20 per active size (40 total per product)**; the [current stock intake](starting-stock-2026-10-24.json) supersedes their earlier 50-total instruction and resolves the size-allocation question. No inventory was changed. Simbiat confirms co-ownership/IRS-document readiness, accepts **4 PM Central Time**, and authorizes a developer mailbox purchase funded by her after concrete terms are agreed. The email date/appointment date remain unverified; no new booking is inferred. Supplied food-collage and Pantry People cap images are for the community/Merch homepage covers, not a priced cap listing. The story-card revision is already implemented locally. Use the [October 24 unsent reply](simbiat-october-24-reply.md); the older sole-owner/allocation/time questions are answered. The meeting's later recipe decision remains in force.

Latest intake, October 24, 2026: [meeting transcript decisions](client-meeting-2026-10-24.md), with recording timestamps. Simbiat requests Google ingredient searches and compact community-story previews; local changes implement those requests. The later recipe discussion pauses a paid product in favor of recording preparation content first. She reports **50/50 ownership with her mother**, superseding the earlier sole-owner uncertainty. Stripe onboarding progresses during the call, but final approval, separate developer access, payout setup and live checkout remain unverified. She agrees to start with a basic mailbox; exact subscription/renewal terms and completed purchase/setup are not evidenced. Interest in a future social-media proposal is not agreement to a retainer or permission to post. The meeting date itself is unconfirmed; October 24 is the transcript intake date.

Latest intake, October 22, 2026: [confirmed business details and current actions](client-feedback-2026-10-22.md). Simbiat reports everything looks fine, confirms **Iya Yusuf's Pantry and Goods LLC**, the Manvel business address and **713-498-4010**, and identifies herself as the person responsible for the account. She requests help creating **info@iyayusufspantry.com**; it is not yet a verified inbox. The owner clarified that email hosting and any additional setup/subscription costs are separate from website development; check the existing Hostinger email plan first. Starting stock is **50 per product**, recorded in the [stock intake](starting-stock-2026-10-22.json), with size allocation pending for egusi, ogbono and palm oil. The original collage at `public/1792604044512blob.jpg`, phone and contact wording were published on October 23 after Contentful access was restored; public desktop/mobile CMS checks passed. Full-image layout and phone-link changes are deployed; all 12 final desktop/mobile public checks passed. Illustrated recipes need more time. Scope is site changes and reply draft only, with Stripe deferred; the proposed October 23 review time remains unconfirmed. The [October 22 unsent reply](simbiat-october-22-reply.md) supersedes the October 16 draft and these facts supersede older requests below.

Latest update, October 16, 2026: [the supplied follow-up](client-feedback-2026-10-16.md) confirms a KTC 24-inch QHD monitor and Chrome, corrects Chin Chin to a **16 oz jar** (published; $10 price/variants preserved), and offers October 23, 24 or 25 at 2 pm “CST.” The owner approved 2560 × 1440 as the working monitor resolution; existing browser checks cover that size. Scaling, Chrome zoom/window state remain unknown; investigate them if the layout issue persists. Confirm the intended time zone before booking a session. Stock counts and live Stripe status are still unknown; recipes, collage and merchandise details are planned for the weekend. The [current unsent reply](simbiat-october-16-reply.md) explains `/#top` and separates client Stripe verification from unfinished developer live-sales work. This supersedes missing-information and provisional-jar statements in the historical updates below.

Historical update, October 14, 2026: [remaining website feedback implemented](client-feedback-2026-10-14.md) records deployed desktop/readability changes, rotating homepage highlights, product hover zoom/enlarged viewer, persistent text-size settings, and the published Merch category and provisional **7 oz Chin Chin jar** ($10 price preserved). The [October 13 source email/status](client-feedback-2026-10-13.md) and [unsent reply draft](simbiat-october-13-reply.md) are updated. The owner confirmed no stock counts or verified live-Stripe information are available yet: **none for now**. Real-payment checks and final stock/delivery/tax acceptance await those inputs; current checkout remains sandbox-only. Recipe PDFs, collage, merchandise listings, her desktop setup and review availability are still needed. Read this update alongside the historical audit below.

The [October 5 email audit](client-email-audit-2026-10-05.md) is the current source for client decisions and open actions: 90 messages across 19 threads, including six service emails beyond the [84-message original intake](client-email-context-2026-10-05.md). The full US$500 fee was acknowledged on September 21, the logo/colors were approved, the supplied catalog was published, and the paid-recipe recommendation was sent. The requested launch estimate and customer-story explanation still need a reply. Private account and receipt details remain in ignored artifacts.

Original notes dated September 20, 2026; corrected against the complete correspondence on October 5. These notes record client statements and service email evidence; current account control and renewal settings have not been independently verified.

Deployment update, 24 September 2026: the user supplied the Vercel production domain [www.iyayusufspantry.com](https://www.iyayusufspantry.com). Direct checks returned HTTP 200 for the homepage and shop. This confirms website availability; registrar, renewal and business email details remain unverified.

## Brand and supplied logo

- Business name shown on the logo: **Iya Yusuf's Pantry**.
- Confirmed brand color: **`#06ad8f`**. The client's explicit hex value takes precedence over colors sampled from the JPEG.
- Client identifies the supplied image as the business logo: [original JPEG](../public/assets/1789861951268blob.jpg).
- Visual inspection: a navy-outlined shopping cart with green and turquoise panels, green uppercase lettering, and a visible gray grid background. The supplied JPEG does not have a transparent background. A clean or vector version would help with website placement.
- Font selection is delegated to the developer; no specific font was requested.
- A [vector reconstruction and transparent PNG set](../public/brand/README.md) is available; the horizontal SVG is used in the storefront header and footer. The client's September 26 reply approves the displayed logo and colors.

## Domain and business accounts

- The earlier possible Shopify domain was replaced by a paid one-year Hostinger registration for `iyayusufspantry.com`, evidenced by the September 23 service receipt. Current registrar expiry, renewal settings, ownership and recovery still need verification.
- The dedicated Google account was created and supplied privately on September 21 WITA. Confirm client ownership and recovery access during handover; do not recreate the account or expose its emailed credentials.
- Desired business contact address is something like `info@iyayusufspantry`; this is an incomplete address pending confirmation of the full domain and email service.
- Existing correspondence comes from `iyayusufpantry@gmail.com` (without the `s` after `yusuf`). Preserve the distinction from the requested new account/domain spelling.
- Vercel verification/setup was confirmed on September 23. Contentful is used by the current site; its September 21 organization invitation and token-expiry notice require membership/expiry checks before handover.
- Client requests guidance on creating a Stripe account. Account setup and integration access are still pending; the earlier email proposes a team invitation if an account already exists.

## Products and content

- Client says products have changed over the years and mentions several attached pictures to provide an idea of the range.
- The logo and all nine additional reference photos in `public/assets` have now been visually inspected. The UI uses the snack assortment, snack jars, coconut strips, bottled drinks, and labeled red palm oil. See [photo mappings](../data/brand-assets.ts). Assortment images are editorial references; only the clearly labeled red palm oil is linked to a specific sample product.
- The [October 5 catalog](client-email-context-2026-10-05.md#confirmed-catalog) records 21 supplied products with descriptions, prices and photographs. Chin Chin net weight and actual stock quantities remain unconfirmed. Existing sample catalog entries are not approved inventory merely because they appear on the site.

## Commercial agreement and progress

- Agreed build fee: **US$500**, replacing the earlier US$1,000 proposal, with the proposal scope retained.
- Initial US$250 was acknowledged on September 20 WITA. The September 21 reply confirms both Wise and Remitly transfers cover the **full US$500 build fee**, and the client acknowledges this. The earlier split-payment schedule is historical; correspondence establishes no remaining US$250 build balance.
- Included scope: online store, Stripe checkout, basic stock and order management, recipes and blog, two revision rounds, training, and 30 days of support for faults in the delivered website.
- Estimated delivery: approximately 4–6 weeks once the initial payment, required materials, and access are ready. Receipt of the deposit alone does not establish a confirmed delivery date.
- Hosting, paid content/data/email services, domain registration and renewals, and payment-processing fees are separate. Costs must be confirmed with the client before purchases or subscriptions. Maintenance after the included support period is optional and agreed separately.
- Work may proceed on structure and other parts that do not depend on final materials or account access.

## Follow-up work

- Obtain final website acceptance; logo/colors already received approval on September 26.
- Confirm registration and renewal details for the deployed `iyayusufspantry.com` domain.
- Confirm ownership/recovery of the already-created business accounts, Contentful membership/token expiry, and the full business contact address and service costs.
- Provide Stripe onboarding guidance and obtain appropriate integration access.
- Confirm actual inventory and final Chin Chin net weight; the provisional 7 oz jar was published October 14 with its $10 price and variants preserved. Await the sourcing collage and recipe PDFs, estimated by the client to take about a week.
- Reply to the requested launch estimate and customer-story appearance questions; see the current audit's action register.

See the [development log](development-log.md) for implementation progress and the [email audit](client-email-audit-2026-10-05.md) for current acceptance/handover obligations. Account creation, Vercel setup and domain payment are evidenced; live-sales readiness, ownership/recovery and renewal settings still need acceptance.
