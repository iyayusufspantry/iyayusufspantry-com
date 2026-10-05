# Client context

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
- Confirm actual inventory and Chin Chin net weight; await the sourcing collage and deferred recipes/step photos.
- Reply to the requested launch estimate and customer-story appearance questions; see the current audit's action register.

See the [development log](development-log.md) for implementation progress and the [email audit](client-email-audit-2026-10-05.md) for current acceptance/handover obligations. Account creation, Vercel setup and domain payment are evidenced; live-sales readiness, ownership/recovery and renewal settings still need acceptance.
