# Client follow-up — received October 16, 2026

Current intake: the [October 22 update](client-feedback-2026-10-22.md) supplies the LLC, business address/phone, responsible person, 50 per product and the first collage in chat. It supersedes the matching open requests below. Use the [October 22 reply draft](simbiat-october-22-reply.md).

Source: Simbiat's message and two images supplied in the development chat. The pasted text mentions `1792115130710blob.jpg`; the images were inspected in chat and are not saved as repository assets. The original email's sent date is not independently verified. This is not a new mailbox or Stripe-account audit. This follow-up supersedes the missing desktop details, provisional jar size and missing availability in the [October 13 register](client-feedback-2026-10-13.md).

## Confirmed client information

- Monitor: KTC 24-inch QHD IPS, 100 Hz, described as Zero-Frame 2K for Gaming Office. Browser: Chrome. The project owner confirmed that the pictured monitor is Simbiat's and instructed us to assume **2560 × 1440** as its working resolution. Do not ask her to confirm the resolution again as a prerequisite to reviewing the layout. Display scaling, browser zoom and maximized/window state remain unconfirmed.
- The supplied promotional image reads `2540 × 1440`; this appears to be a typo, since the matching [KTC H24T27 guide](https://ca.ktcplay.com/pages/h24t27-monitor-support) specifies **2560 × 1440**. The owner's accepted assumption uses 2560 × 1440. She also suggests “Apple XDR Display (P3-1600 nits)” as the resolution; this is a colour/brightness reference mode, per [Apple's reference-mode explanation](https://support.apple.com/en-gb/108321). Existing 2560 × 1440 browser checks cover the working resolution; browser zoom/scaling can still produce a different CSS viewport.
- Chin Chin is in a **16 oz jar**, like the other jar products. This supersedes the provisional 7 oz label. Treat this as the supplied jar-size label; net food weight and packed shipping weight have not been established by this statement.
- She plans to work on recipe PDFs, the sourcing collage and merchandise details over the weekend. This is an intention, not a firm delivery deadline or permission to invent listings.
- She will supply starting stock quantities. No counts were included.
- She offers **October 23, 24 or 25 at 2 pm “CST”** for payment, stock, delivery and final review. No date has been selected and no appointment has been booked.
- She assumed Stripe setup was complete and asks what she needs to do. Account readiness remains unknown; do not describe verification as failed or imply that all remaining launch work belongs to her.
- She asks whether the URL change after clicking the business name is normal. Her screenshot shows `iyayusufspantry.com/#top`.

## Business-name URL

The header and footer wordmarks in `components/site-shell.tsx` intentionally link to `/#top`. The existing handler also scrolls to the top on repeated homepage navigation. The screenshot matches that behavior: `#top` is a page fragment, not a different domain or an error. No URL change is required to answer this question.

The screenshot alone does not establish a new layout regression, current viewport size, browser zoom or which deployment was loaded. Do not infer a need to widen the layout again from the monitor's physical size.

## Catalog correction

Published only `pantryProduct.unit` from `7 oz jar` to `16 oz jar` for `classic-chin-chin`, entry `pantry-product-661fd7e6533bef25c5acb46a`. The product's $10 price, Standard option, variant references, other fields and other locales were preserved. No inventory was changed.

`node scripts/contentful/october-16.mjs` previews the correction; `--apply` backs up the entry, rejects editor drafts, uses version checks, verifies the saved fields and publishes that version. The repeat preview reports no changes. Evidence and the backup are under ignored `artifacts/client-feedback-2026-10-16/`. The historical October 14 script rejects the new label rather than reverting it; do not rerun old corrections to restore superseded content.

The existing browser assertion now expects `16 oz jar` and $10. No application deployment is needed for this CMS field change. The October 14 PDF and older notes remain historical and may show the superseded 7 oz label.

## Stripe explanation and remaining work

October 17 clarification from the developer: Simbiat has already granted Stripe access, including access to perform live-account setup. Do not ask her to invite the developer again or require her to perform the whole setup herself. The supplied Activate Payments screenshot is at the business-type step. Obtain confirmed business registration/legal name, business address/phone, customer contact details and the responsible person's identity/role before entering missing facts. The developer can continue setup using existing access; arrange any requested private identity, tax or bank entry directly in Stripe with Simbiat. This supersedes the client-led setup/access request below. Access does not establish account approval or website live-sales readiness.

The website has a tested sandbox integration. `lib/payments/config.ts` rejects live keys and `lib/payments/http.ts` rejects live events; replacing a key cannot enable sales. No live account was inspected and no real charge or payout was performed during this follow-up.

Simbiat's part is to check her business's live Stripe Dashboard and complete any requested business/owner verification and payout-bank setup directly with Stripe. She may already have completed some or all of this. See Stripe's [account setup](https://docs.stripe.com/get-started/account/set-up) and [account checklist](https://docs.stripe.com/get-started/account/checklist). Access should use [team invitations](https://docs.stripe.com/get-started/account/teams), not shared passwords or credentials sent by email.

The developer's part still includes the live checkout/order/inventory configuration, live webhook processing, approved shipping and tax settings, and final acceptance. Existing sandbox orders and sample inventory are not real stock. The working US-only / $6.99 shipping / free shipping from $60 defaults are still awaiting final approval and live implementation; sandbox shipping/tax are zero. Account verification alone does not finish this work. See [Stripe implementation notes](stripe-payments.md) and [launch audit](launch-readiness-audit.md).

## Review scheduling

October 23, 24 and 25, 2026 are Friday, Saturday and Sunday. Confirm her city or intended UTC offset before selecting a date. In US Central locations observing daylight saving, these dates are **CDT (UTC−5)**; the return to standard time is November 1, per [the 2026 Illinois time-change calendar](https://www.timeanddate.com/time/change/usa/illinois). Literal **CST (UTC−6)** would be one hour later.

| Interpretation of 2 pm               | UTC                        | Developer time, Asia/Makassar (UTC+8) |
| ------------------------------------ | -------------------------- | ------------------------------------- |
| US Central daylight time, UTC−5      | 19:00 on the proposed date | 03:00 the following day               |
| Literal Central standard time, UTC−6 | 20:00 on the proposed date | 04:00 the following day               |

For example, October 23 at 2 pm in Chicago is October 24 at 3 am in Makassar. These are candidate times only. Do not choose a slot on the developer's behalf, create an event, promise a live-sales launch or assume a meeting duration.

## Follow-up register

1. Use the owner-approved **2560 × 1440** monitor resolution assumption and existing checks at that size. Obtain client acceptance of the deployed layout and reading/photo controls; ask about display scaling, Chrome zoom and window state if the reported issue persists.
2. Receive food/drink and merchandise stock counts. Keep physical stock separate from sandbox sample quantities.
3. Receive recipe PDFs, collage and merchandise descriptions/photos/prices/options; no deadline is agreed.
4. Confirm live Stripe status and any outstanding Dashboard requirements; complete the developer's live implementation and final delivery/tax/policy decisions.
5. Resolve “CST,” agree one of the three dates and then arrange the review. No meeting or launch date is confirmed.
6. Send the [new reply](simbiat-october-16-reply.md) only when instructed; the October 13 draft is superseded.

## Verification

CMS preview, publication and a repeat preview passed. Both existing Chin Chin browser checks passed against the canonical public website (desktop and mobile), confirming `16 oz jar` and $10. An initial mobile request still showed the old cached 7 oz label; a fresh run after propagation passed without application changes.

Additional public Chromium checks at 2560 × 1440 and 390 × 844 passed: product response 200, wordmark navigation from the product page to `/#top`, repeated homepage logo clicks scrolling to the top, no horizontal overflow and no uncaught page errors. Header content measured 1600 pixels with 480-pixel margins at 2560, and 350 pixels with 20-pixel margins at 390. These controlled viewport checks do not establish her actual browser settings. Results are saved in `artifacts/client-feedback-2026-10-16/public-results.json`.

Changed-script/test ESLint, changed-file Prettier and `git diff --check` passed. No application build/deployment was needed for this CMS label and documentation update. No email was sent, calendar event created or live-sales activation performed.
