# Store operations

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

No real owner identity or email sender was guessed. Until configured, access is denied and public forms retain their explicit prototype behavior. `npm run operations:check` reports local configuration and endpoint status without printing secrets. Add `-- --public` to probe the public checkout and webhook using the Dashboard secret in `.env`; local CLI forwarding uses `.env.local` instead.

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

Email is queued durably. The worker uses a lease and an immutable provider idempotency key so concurrent jobs and retries do not create duplicate sends. Transient failures wait five minutes. Uncertain requests older than 23 hours move to `review` instead of being automatically resent past the provider's deduplication window. Investigate these entries against the provider delivery log before any manual retry. A provider acceptance response is not proof of inbox delivery.

After configuring email, `npm run operations:mail` drains up to 20 queued messages. Running it sends actual mail; automated tests use fake transports and do not call the provider. A disabled provider leaves mail queued.

For automatic operation, configure a scheduler to request:

```text
GET https://www.iyayusufspantry.com/api/cron/maintenance
Authorization: Bearer <CRON_SECRET>
```

Run approximately every five minutes using a scheduler supported by the hosting account. The handler reconciles ten pending Stripe sessions, recovers missing eligible sandbox receipt jobs, sends up to five queued emails, and prunes expired rate-limit counters. A failure returns non-2xx. Old unresolved orders rotate through batches and cannot permanently block newer ones. Uncertain payments retain their reservations until Stripe confirms their outcome. A scheduler has **not** been activated because deployment access is not yet available.

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

Vercel configuration still needs a signed-in CLI/account connection. Public sandbox checkout requires the feature flag, canonical `APP_URL`, test credentials, matching Dashboard webhook secret, database schema, and `FORM_SECRET`. Local configuration does not update Vercel automatically.

The owner identity, email-provider credentials/verified sender, and shipping/tax decisions are still required. Live Stripe processing remains intentionally unsupported until the separate live inventory/payment configuration and approved business rules are implemented. Policies, final product information, social destinations, marketing delivery, and search indexing still need the business's launch decisions. The site continues to identify itself as a prototype and remains noindex.
