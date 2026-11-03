# Client follow-up — received October 30, 2026

Source: the email text and three Mail screenshots pasted in the development chat. The screenshot shows Simbiat's “Re: More Products” response and the sent social proposal dated October 27. No live mailbox search was needed to establish those supplied facts.

## Requests and decisions

- Simbiat acknowledges the visible website updates and asks how to pay for the Hostinger mailbox at `info@iyayusufspantry.com`. Her earlier authorization for the developer to purchase with her funding still applies, subject to confirmed checkout terms and payment before ordering. The approximate $17/12-month estimate is not a verified amount or invoice.
- She reports **Owner access required** while signed in as `iyayusufspantry@gmail.com` (with the “s” after “yusuf”). This differs from the correspondence address `iyayusufpantry@gmail.com`.
- She asks to add **Nigerian dates**, a major missing ingredient, to Tiger Nut Drink.
- She asks for next steps and what is needed from her. Finish the existing website agreement independently of the optional monthly package. Stripe integration/live testing, mailbox setup, owner handover and final launch acceptance remain outstanding; review previously supplied delivery/policy information before requesting additional decisions.
- The supplied sent-email screenshot establishes that the **US$500/month Pantry Content & Care proposal** was sent October 27, including a 30-day paid pilot, 8 videos, 4 image posts, 8 reused Story frames, supplied-draft article SEO and one hour of website care. This is not evidence of acceptance, payment or publishing authorization.

## Ingredient correction

`scripts/contentful/october-30.mjs` previews or, with `--apply`, publishes only the requested description and ingredient corrections. It requires exactly one matching product, checks for pending editor changes and unexpected wording, preserves all other fields/locales, saves an ignored backup, and uses Contentful version checks. Rerunning after publication reports no changes.

Published entry: `pantry-product-119895c28a1b36718c72fd9c`, slug `tiger-nut-drink`.

- Description now says “blends tiger nuts, Nigerian dates, and water”.
- Ingredient list now says “Ingredients: tiger nuts, Nigerian dates, water, ginger, cloves, cinnamon, and honey.”
- Compared the saved product against its backup: only those two default-locale values changed. Price, 16 oz bottle size, variants, photo references, allergens and other fields are preserved.
- Authenticated public Contentful revalidation returned HTTP 200. The public product page returned HTTP 200 and rendered Nigerian dates in its introductory description, product details and ingredient list. This is a CMS publication; no application deployment was needed.

## Owner access

Read-only Clerk inspection confirmed that the screenshot's exact email belongs to a verified user in the configured development instance. The locally configured allowlist contained `zulzdn@gmail.com` and the correspondence email without the “s”; the screenshot's address was absent. Added `iyayusufspantry@gmail.com` to the ignored local configuration, retaining existing allowed owners. The application continues to require server-side ownership and verified email; no authorization code was loosened and no account/session was created or impersonated.

**Production access is now granted.** The initial Vercel login lacked project access (403). After the user explicitly requested the grant and completed sign-in with the project account, confirmed that the production Clerk publishable key matches the local instance and that the screenshot's email belongs to the existing verified account `user_3LOtlwT7POzMndhhz697uquAXHO`. Added that stable ID to a new production `OWNER_CLERK_USER_IDS` variable. The existing sensitive `OWNER_EMAILS` variable was preserved; its hidden value was not overwritten. No other account was granted access.

Redeployed the previously live source commit `cd0ff3c9185a5c04d7e0a2b9e8f4cdc4464fc910`, without including unrelated local edits. Deployment `dpl_uK9bPvBkAitYdrjeWss1G76mR8Ff` is READY, is the project's production target and has the public domains assigned. Verified the new production ID value against the actual Clerk user and the unchanged deployed authorization helper: the owner is allowed, while null and unrelated users are denied. Public homepage returns 200, anonymous `/api/owner` returns 401, and anonymous `/owner` redirects to sign-in (307). Simbiat should refresh the dashboard using her existing account; her own signed-in browser view remains unobserved. No user session was created or impersonated.

## Mailbox and correspondence

October 31 source clarification: the user supplied two full pasted email threads. The latest “Hey Zul” thread quotes Simbiat confirming that she has the tax identification number and all required IRS tax documentation, with the LLC and co-ownership details. Neither supplied thread mentions a state sales-tax permit, resale certificate, collection registration or approved collection instructions. This is evidence of what these threads contain, not proof that she has no permit or never sent one elsewhere. The developer's quoted progress email is dated October 26, 2026 at 16:12:47 CDT, establishing it was sent; earlier statements treating the October 24 follow-up as only an unsent draft are historical. No raw credentials, payment/bank information or complete private threads were copied into this record.

Later evidence in this chat supersedes the earlier purchase-pending status. The user says he purchased the mailbox. Hostinger screenshots show **Starter Business Email**, an active `info@iyayusufspantry.com` mailbox with **5 GB** storage, and subscription expiry **October 30, 2027**. The supplied Jago receipt shows a successful payment to **Hostinger for IDR 105,228**, dated October 30, 2026 at **18:48 WITA**. The user identifies that payment as the mailbox purchase; the bank receipt itself is not an itemized subscription invoice. Record only the payee, amount and date/time, without copying banking/account/PAN or transaction identifiers.

The earlier **IDR 265,068** checkout screenshot is an additional 12-month **renewal quote** with projected expiry October 30, 2028; it is not a paid receipt and does not establish the current purchase amount. The earlier approximate US$17 estimate is superseded by the actual paid IDR amount in the internal cost record. An earlier draft included **approximately US$5.80**, calculated as 105,228 / 18,128 using the midpoint of [Bank Indonesia's October 30 USD sell/buy rates](https://www.bi.go.id/en/statistik/informasi-kurs/transaksi-bi/transaksi-bi/Default.aspx) (18,218.64 / 18,037.36). This is a reference equivalent; the actual paid amount remains IDR 105,228 and the transfer provider's rate may differ. No additional setup fee is quoted. The user subsequently chose to cover the first year as a courtesy, through October 30, 2027; no client reimbursement is due. Future renewals remain separate, and this courtesy is independent of the social-media proposal. The current client email omits the cost, conversion and payment request. DNS status, successful incoming-mail/reply tests and secure sign-in handover are not established by these screenshots; a welcome email alone does not verify full delivery.

The [new unsent reply](simbiat-october-30-reply.md) acknowledges the published correction and completed owner-access grant, asks Simbiat to refresh the dashboard, confirms that the developer has covered the first year through October 30, 2027 with nothing to reimburse and separate future renewals, and identifies the remaining website work. It contains no social-media follow-up and supersedes the October 24 reply for this follow-up. No message was sent.

Hostinger's [email management guide](https://www.hostinger.com/support/4768093-how-to-access-the-email-section-at-hostinger/) and [mailbox setup guide](https://www.hostinger.com/support/1583217-how-to-create-and-manage-mailboxes-for-hostinger-email/) were checked October 30 during the earlier intake. The later user-supplied evidence above establishes the reported purchase and displayed active plan. The agent performed no Hostinger purchase, billing action, mailbox creation, DNS change, email send or social action.

Product backup, publication plan, rendered HTML and the verification report are in ignored `artifacts/client-feedback-2026-10-30/`. That folder also contains a private local-environment rollback copy; do not share it with client materials.

Validation: all 11 existing operations tests passed. A separate read-only check using the existing verified Clerk user and the actual updated local configuration confirms the owner is allowed, while anonymous and unrelated verified users remain denied; no sign-in session was created. The publication rerun reports no changes. New-file Prettier checks and `git diff --check` passed. No application source or dependencies changed, so no application build was required.
