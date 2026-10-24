# Client feedback — October 13, 2026

Source: Simbiat's email pasted into the development chat on October 13, with two screenshots in `public/assets/13 oct/`. This is supplied correspondence, not a newly fetched mailbox audit.

## Completion status — updated October 16, 2026

Latest: [October 16 supplied follow-up](client-feedback-2026-10-16.md) confirms a KTC 24-inch QHD monitor and Chrome, corrects Chin Chin to a **16 oz jar** (published), and offers October 23/24/25 at 2 pm “CST.” The owner approved **2560 × 1440** as the working monitor resolution. Zoom/scaling/window details remain unknown; the intended time zone still needs confirmation. No appointment is booked. The [October 16 reply](simbiat-october-16-reply.md) supersedes the older unsent draft and explains the remaining client and developer Stripe work.

**The website feature work is implemented and deployed.** Live-sales acceptance and client-supplied materials remain pending. The owner confirmed on October 14 that no stock counts or verified live-Stripe account information are available yet. See [October 14 implementation and deployment](client-feedback-2026-10-14.md) and the [updated 23-page review PDF](../output/pdf/Simbiat-Website-Review-October-14.pdf). The October 13 implementation/test notes below are historical.

| Item                                                                        | Status                                                                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Wider desktop layout and larger small text                                  | Implemented, tested and deployed                                                                |
| Desktop comparison PDF                                                      | Refreshed October 14; 23 pages including new controls and Merch                                 |
| Saved feedback/context and reply asking for desktop details                 | Updated; reply remains unsent                                                                   |
| Client desktop details and review appointment                               | KTC 24-inch QHD / Chrome supplied; three dates proposed; time zone unresolved; no booking       |
| Deployment of layout/text changes                                           | Complete; production deployment `dpl_5dCj95o9d6tE1UymGziSBTJQRZYz`                              |
| Rotating promotional banner on the landing page                             | Complete; five-second rotation, controls, pause and reduced-motion support                      |
| Product-image enlargement and optional text magnification                   | Complete; hover zoom, enlarged photo viewer and persistent text-size settings                   |
| Merch category and merchandise listings                                     | Category published and empty state implemented; listings await supplied details/assets          |
| Chin Chin jar size                                                          | Corrected to 16 oz jar on October 16; $10 price and variants preserved; shipping weight unknown |
| Live-payment checks, confirmed stock/delivery settings and final acceptance | Awaiting actual stock/live-account/tax/fulfillment inputs; sandbox checks passed                |
| Recipe PDFs and sourcing collage                                            | Awaiting client materials                                                                       |

## Client statements and requests

- She has returned after being away and confirms all product photos and descriptions are showing on the website.
- She asks when to complete live-payment checks, confirm stock and delivery settings, and finish the final review. No appointment or launch date has been agreed.
- Recipe PDFs and the sourcing photo collage may take about a week; this is an estimate, not a firm deadline.
- She authorizes a provisional **7-ounce** weight for what the email calls the "chin chin chain," pending confirmation. The supplied Chin Chin listing was identified and published as 7 oz jar on October 14; its price/variants were preserved. Packed shipping weight has not been supplied or inferred.
- Desktop has excessive blank space on both sides; she says mobile does not have that issue.
- Add a rotating banner at the top of the landing page, changing every few seconds and spotlighting content currently farther down the page.
- Enlarge small text; she suggests optional hover magnification for text and product photos, including customers needing extra-large print.
- Add a merch category for aprons, tote bags, T-shirts, hats, stickers, etc. Actual merchandise listings, photos, prices and inventory are not yet supplied.

## Screenshot findings (October 13, historical)

- `1791863258967blob.jpg`: 2530 × 714 image; homepage header and hero occupy roughly half its width.
- `1791863824756blob.jpg`: 3298 × 1266 image; hero footer, values strip and category heading illustrate small text.
- Screenshot pixel dimensions do not establish CSS viewport width or physical display size. Browser zoom, OS scaling, capture method and window size can affect them. Her computer/monitor, screen resolution, browser and zoom remain unknown.
- The existing shared container was limited to 1200 CSS pixels. A redundant large-screen maximum of 1280 pixels did not expand that width.

## Original work on October 13

The project owner requested the proposed desktop width/readability changes, a reply asking which desktop she uses, and durable context. This does not authorize sending the email or deploying the website.

- Expanded the shared container to `min(1600px, calc(100% - 80px))`; phones keep 20-pixel side gutters.
- Increased homepage/storefront supporting text to 14 pixels and common body/card text to 16 pixels, with the desktop hero introduction at 18 pixels. Enlarged navigation, product titles/prices, category labels and footer text.
- Retained comfortable paragraph lengths. Category cards can grow with their text; product headings/prices and metadata can wrap.
- Removed the forced tiny product-details link utility so the readable size applies.
- Validation completed; results and local screenshots are recorded below.

## Validation and evidence

Recheck and PDF review, October 13: a fresh production build/TypeScript check, full lint and repository formatting check passed. Browser layout checks passed for **28 public/current preview routes at 10 widths** (320, 390, 768, 1024, 1280, 1366, 1440, 1536, 1920 and 2560 pixels), with HTTP 200, no horizontal overflow and no uncaught browser errors. Homepage and Shop WCAG A/AA scans passed at 390, 1440 and 2560 pixels. All **30 existing account, product-gallery and CMS checks** passed in desktop/mobile projects. This rechecks layout and those workflows; it is not a live-payment or inventory audit.

The [desktop size review PDF](../output/pdf/Simbiat-Desktop-Size-Review.pdf) contains **19 pages**: a comparison table/overview, plus homepage opening, homepage category section and scrolled shop product-card captures at 1280, 1366, 1440, 1536, 1920 and 2560 pixels. Each uses a 16:9 viewport, 100% browser zoom and device pixel ratio 1; images and account controls were loaded before capture. Measured content width and side margins are labeled. The 1600-pixel cap leaves 160-pixel margins at 1920 and 480-pixel margins at 2560. Poppler rendered all PDF pages; the page overview and selected full-size pages were visually checked, and all 19 pages were verified for screenshots, numbering and local-preview status. Recheck artifacts and scripts are under ignored `artifacts/desktop-review-2026-10-13/`. No application deployment or client email occurred.

- Production build (including TypeScript) passed; targeted ESLint, changed-file Prettier checks and `git diff --check` passed.
- Browser checks passed at **320, 390, 768, 1024, 1366, 1440, 1920 and 2560** CSS pixels across **10 routes** each: home, shop, Donkwa product detail, about, recipes, blog, stories, contact, cart and checkout. All returned HTTP 200, had the expected container width, and had no horizontal overflow or uncaught browser errors. Checked supporting text renders at least 14 pixels at each width.
- Homepage WCAG A/AA axe scans passed at 390, 1440 and 2560 pixels. The existing Shop accessibility/screenshot and small-phone/tablet product-gallery checks also passed in both Playwright projects (four checks).
- Visually reviewed desktop hero captures at 1440 and 2560 pixels, mobile hero at 390 pixels, category cards at 390 pixels and a product card at 320 pixels. Detail captures use reduced motion to avoid capturing the existing entrance fade mid-animation.
- Local evidence is Git-ignored under `artifacts/client-feedback-2026-10-13/`: `layout-results.json`, `hero-1440.png`, `hero-2560.png`, `hero-390.png`, `categories-390.png`, `product-320.png`, full-page screenshots and the one-off check/capture scripts.
- No deployment or external catalog update occurred. No email was sent and no appointment was booked. These checks do not establish the client's exact desktop view, live payments, actual stock or delivery settings.

## Follow-up register (updated October 16)

1. Use the owner-approved **2560 × 1440** working resolution for the supplied KTC 24-inch QHD monitor and Chrome. Existing browser checks cover that size. Ask about scaling, browser zoom and window state if the layout issue persists; further resolution confirmation is not a prerequisite.
2. Obtain client acceptance of the deployed desktop layout, banner, photo enlargement and reading controls. Implementation/deployment are complete.
3. Collect approved merchandise descriptions, photos, prices, sizes/options and stock before publishing sale listings. The Merch category is ready.
4. The client corrected the jar size to 16 oz; that label is published. Net food weight and packed shipping weight remain separate and unverified.
5. Confirm physical stock, delivery coverage/rates, tax/ship-from details and final policies. The client will send starting quantities; none are supplied yet. Live Stripe status is unknown and the new draft explains the account steps and outstanding website implementation.
6. Choose from October 23, 24 or 25 at 2 pm only after confirming the intended “CST” time zone and the developer's availability. No appointment is booked. Current checkout remains sandbox-only; no live-payment check or real charge has been performed.
7. The client plans to work on recipe PDFs, collage and merchandise details over the weekend. No firm delivery deadline or automatic schedule is agreed.

Current unsent reply: [October 16 draft](simbiat-october-16-reply.md). The [October 13 draft](simbiat-october-13-reply.md) is historical. Earlier confirmed history: [October 5 email audit](client-email-audit-2026-10-05.md).
