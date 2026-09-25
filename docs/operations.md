# Store operations

## Activation update — 25 September 2026

Vercel CLI access is connected to the existing project. The owner's supplied, verified Clerk email is configured privately as the owner allowlist. Public sandbox checkout and the contact inbox are active with the canonical website origin and a replacement Stripe test destination whose signing secret is synchronized to Vercel. The obsolete destination is disabled. Contact submissions do not require outgoing email.

`vercel.json` schedules maintenance daily at 05:00 UTC as a recovery backup. `.github/workflows/store-maintenance.yml` adds a five-minute schedule and manual dispatch, authenticated with the repository secret `PANTRY_MAINTENANCE_TOKEN` matching Vercel's `CRON_SECRET`. The workflow has no repository permissions and checks out no code. No paid hosting upgrade is made. See [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Resend accepted a simulated message from `notifications@iyayusufspantry.com`. Sending and newsletters are configured in production. The send-only API key remains private and cannot inspect domain status or delivery logs. The dashboard may still show partial verification when receiving or a fallback sending record is pending; sender acceptance does not prove every DNS record is verified or that an email reached a real inbox. The optional `EMAIL_REPLY_TO` setting is saved with each queued email so retries preserve the original payload. Contact notifications retain the customer's own reply address. See [Launch settings](store-launch-settings.md) for selected US defaults and remaining details.

Verification: production build and lint passed; all ten operations tests passed. A public hosted test-card purchase returned the paid confirmation screen. Public session retry/expiration checks passed, including Stripe's confirmation of successful webhook delivery. The contact browser check saved a database message and removed only its test record; no email was queued. The authenticated maintenance request returned 200, and the deployment exposes the daily cron definition. Owner email verification and anonymous access denial were checked; the owner still signs in using their own credentials.

The application now has a protected `/owner` dashboard, a persistent contact inbox, confirmed newsletter subscriptions, an email outbox, and a maintenance endpoint. These complement the existing **sandbox-only** checkout. The public `/prototype/owner` remains a fictional demonstration.

## Database and local configuration

Run these commands without copying Markdown fences into PowerShell:

```powershell
npm run payments:setup
npm run operations:setup
```

Both commands preserve existing data. The new `simbiat_operations` schema contains messages, subscribers, queued email, and rate-limit counters. Sandbox orders also gain fulfillment/reconciliation timestamps and an owner audit table. `operations:setup` generates missing `FORM_SECRET` and `CRON_SECRET` values in ignored `.env.local`; it never prints their values. Set these separately in the deployment environment.

Configure these server-only variables as needed:

| Variable                      | Purpose                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_URL`                     | Exact website origin; local example `http://localhost:3002`, public `https://www.iyayusufspantry.com`.                                    |
| `OWNER_CLERK_USER_IDS`        | Comma-separated Clerk user IDs allowed to access `/owner`.                                                                                |
| `OWNER_EMAILS`                | Alternative comma-separated owner emails. Clerk must report the address as verified. Do not assign ownership from user-editable metadata. |
| `FORM_SECRET`                 | Random secret for hashing form rate-limit identities.                                                                                     |
| `CONTACT_ENABLED=true`        | Enables real contact submissions only when the database, form secret, and an owner allowlist are also configured.                         |
| `NEWSLETTER_ENABLED=true`     | Enables subscriptions only when the database, form secret, and email delivery are configured.                                             |
| `RESEND_API_KEY`              | API key for the implemented Resend email adapter.                                                                                         |
| `EMAIL_FROM`                  | Approved sender on a verified sending domain, for example `Pantry <hello@your-domain.example>`.                                           |
| `EMAIL_DELIVERY_ENABLED=true` | Explicitly enables outbound email. Leave unset until the provider and sender are ready.                                                   |
| `CONTACT_NOTIFICATION_EMAIL`  | Optional business inbox to notify about saved contact messages. Without it, messages still appear in `/owner`.                            |
| `SANDBOX_ORDER_EMAILS=true`   | Optional test-payment receipts.                                                                                                           |
| `EMAIL_TEST_RECIPIENTS`       | Comma-separated addresses allowed to receive sandbox order receipts. Other test/customer addresses are never emailed by this flow.        |
| `CRON_SECRET`                 | Random bearer token protecting the maintenance endpoint.                                                                                  |

The owner supplied the allowlisted identity. Contact and newsletter subscriptions are enabled. `npm run operations:check` reports local configuration and endpoint status without printing secrets. Add `-- --public` to probe the public checkout and webhook using the Dashboard secret in the original `.env` text; local CLI forwarding uses `.env.local` instead. Next's expanded per-file environment map must not be used to select the Dashboard secret because it can contain higher-priority local overrides.

The readiness report separates `local` configuration from `website` probes. It accepts either owner allowlist, checks all eight database tables, and continues website checks if the database is unreachable. Public probes check form validation, anonymous protection for owner/export/maintenance, and the saved Dashboard signing secret. They create no contact message, subscription, order, or email. A 400 response to an invalid form proves only that validation is reachable; it does not prove payment or email delivery works. A 401 from maintenance does not prove a scheduler exists. Missing settings produce a nonzero exit code deliberately.

### Inputs needed to finish activation

Provide these business settings, and keep credentials in ignored environment files or the provider dashboard:

- **Hosting:** a Vercel account connection or completed `npx vercel login` for this project.
- **Owner:** verified Clerk sign-in email or Clerk user ID to allowlist.
- **Email:** provider choice (Resend is implemented), verified sender, business inbox, and provider credentials. Actual sends require explicit authorization.
- **Fulfillment:** shipping countries, rates/free-shipping threshold, dispatch timing, approved product prices, and real starting inventory.
- **Tax:** the business's approved tax configuration, including whether Stripe Tax is configured. No tax obligations or rates are inferred from the website currency.
- **Launch content:** final business/contact details, social links, and approved shipping, returns, privacy, and terms content.

Deployment configuration and sandbox acceptance testing come first. Live checkout requires separate implementation and validation after the commercial settings are provided; a live Stripe key alone is insufficient. Search indexing should be enabled only after launch content is final.

## Owner workflow

Sign in with an allowlisted Clerk account and visit `/owner`. Every data endpoint repeats the server-side ownership check. Unauthenticated API requests receive 401; authenticated non-owners receive 403. Owner responses are not cached.

- Review saved sandbox orders in pages of 25. Customer/shipping details appear only in this protected view.
- Mark a **paid** test order fulfilled. Repeated clicks are idempotent. This records a sandbox workflow change, not an actual shipment.
- Edit sample stock. Reservations are protected, and stale edits return a conflict rather than overwriting concurrent checkout changes. Stock and fulfillment changes record the actor in an audit table.
- Read the latest 100 contact messages and mark them handled. Reply through the business mailbox; the dashboard does not impersonate a mail client.
- Review subscriber and email-queue counts. Download up to 10,000 confirmed subscribers via the protected CSV export. Pending and unsubscribed addresses are excluded.

Contact submissions are validated, bounded, rate-limited, and keyed to prevent duplicates after uncertain network errors. No success response is returned before the database write completes.

Newsletter forms require explicit consent. Confirmation links expire after 24 hours; simply opening a link makes no change. The recipient must press Confirm. Subscription links put their random token in the URL fragment, then submit it with a same-origin POST. Unsubscribe works without signing in, and an old confirmation cannot reactivate an unsubscribed address. Email scanners making GET requests cannot subscribe or unsubscribe anyone. This provides subscription collection/export; campaign composition and sending are still handled by the chosen marketing service.

## Email and maintenance

To send the Resend onboarding example, add `RESEND_API_KEY=re_xxxxxxxxx` to your ignored `.env` and replace `re_xxxxxxxxx` with the real API key. Never put this key in client components or a `NEXT_PUBLIC_` variable.

```powershell
npm run operations:email-test -- --dry-run
npm run operations:email-test
```

The dry run prints the message and whether a key is configured, without revealing the key or contacting Resend. Running without `--dry-run` sends the supplied “Hello World” HTML message from `onboarding@resend.dev` to `iyayusufspantry@gmail.com`. This is an explicit standalone test command; it does not drain the customer email queue or enable newsletter delivery. The recipient must be the email associated with your Resend account when using the onboarding sender. Customer emails require your verified sending domain. See [Resend's Node.js guide](https://resend.com/docs/send-with-nodejs).

Email is queued durably. The worker uses a lease and an immutable provider idempotency key so concurrent jobs and retries do not create duplicate sends. Transient failures wait five minutes. Uncertain requests older than 23 hours move to `review` instead of being automatically resent past the provider's deduplication window. Investigate these entries against the provider delivery log before any manual retry. A provider acceptance response is not proof of inbox delivery.

After configuring email, `npm run operations:mail` drains up to 20 queued messages. Running it sends actual mail; automated tests use fake transports and do not call the provider. A disabled provider leaves mail queued.

For automatic operation, configure a scheduler to request:

```text
GET https://www.iyayusufspantry.com/api/cron/maintenance
Authorization: Bearer <CRON_SECRET>
```

Contact and newsletter routes attempt delivery after responding using Next.js `after`, with a three-message batch and the existing outbox leases. Failed/interrupted sends remain queued for the five-minute GitHub Actions worker. The daily Vercel job remains a backup. GitHub scheduled runs can be delayed or dropped, and public repositories disable inactive schedules after 60 days; monitor workflow results and re-enable them if needed. See [GitHub scheduling limits](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). The handler reconciles ten pending Stripe sessions, recovers missing eligible sandbox receipt jobs, sends up to five queued emails, and prunes expired rate-limit counters. A failure returns non-2xx. Old unresolved orders rotate through batches and cannot permanently block newer ones. Uncertain payments retain their reservations until Stripe confirms their outcome.

The existing `npm run payments:reconcile` command uses the same reconciliation implementation and handles up to 100 orders without dispatching mail.

## Verification

```powershell
npm run build
npm run lint
npm test
npm run payments:test
npm run payments:test-ui
npm run operations:test
npm run operations:test-ui
npm run operations:test-auth
```

Database tests use random temporary schemas and clean up only those schemas. The auth acceptance check requires Clerk development keys and a production build, starts a dedicated local server on port 3104, creates reserved test-email accounts, verifies sign-up/OTP/sign-in/sign-out, tests owner versus non-owner access, and checks a real saved contact submission. It deletes its exact generated accounts/message afterward. It does not send real verification email. Port 3104 must be free.

References: [Clerk user data](https://clerk.com/docs/nextjs/guides/users/reading), [Clerk test emails](https://clerk.com/docs/guides/development/testing/test-emails-and-phones), [Clerk testing helper](https://github.com/clerk/javascript/blob/main/packages/testing/src/playwright/setupClerkTestingToken.ts), [Resend email API](https://resend.com/docs/api-reference/emails/send-email), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Remaining launch dependencies

Public sandbox checkout is configured and tested. Local configuration still does not update Vercel automatically; future environment changes require explicit synchronization and a new deployment.

The sending key, production sender, immediate dispatch, and recurring recovery worker are configured. Full DNS status and inbox delivery still require access to the Resend dashboard or a connected Resend integration. US shipping defaults are recorded in the launch settings, but tax setup and real inventory remain unresolved. Live Stripe processing remains unsupported until separate live inventory/payment configuration and business rules are implemented. Policies, final product information, social destinations, marketing delivery, and search indexing still need the business's launch decisions. The site continues to identify itself as a prototype and remains noindex.
