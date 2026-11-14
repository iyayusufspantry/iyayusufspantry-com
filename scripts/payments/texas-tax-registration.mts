// Preview by default. --apply adds only the authorized future Texas registration.
// This never enables checkout, changes product tax categories, or submits a payment.
import Stripe from "stripe";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");
const args = process.argv.slice(2);
assert.ok(
  args.every((arg) => arg === "--apply"),
  "Unknown argument",
);
const apply = args.includes("--apply");
const expectedAccount = "acct_1UITMPHKfhrlO2yz";
// The permit's date is a Texas business date: midnight CST, not the operator's WITA.
const activeFrom = Date.parse("2026-11-23T00:00:00-06:00") / 1000;
assert.equal(
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "short",
    timeStyle: "long",
  }).format(new Date(activeFrom * 1000)),
  "11/23/26, 12:00:00 AM CST",
);
const params: Stripe.Tax.RegistrationCreateParams = {
  country: "US",
  country_options: { us: { state: "TX", type: "state_sales_tax" } },
  active_from: activeFrom,
};
const privateEnv = parseEnv(await readFile(".env", "utf8"));
const key = privateEnv.STRIPE_API_KEY?.trim();
assert.match(key || "", /^(sk|rk)_live_/, "STRIPE_API_KEY must be live");
const stripe = new Stripe(key!, { timeout: 20000, maxNetworkRetries: 2 });
const account = await stripe.accounts.retrieve(null);
assert.equal(account.id, expectedAccount, "Unexpected Stripe account");
assert.ok(account.charges_enabled && account.payouts_enabled);
assert.equal(account.capabilities?.card_payments, "active");
const taxSettings = await stripe.tax.settings.retrieve();
assert.equal(taxSettings.status, "active");
assert.equal(taxSettings.head_office?.address?.country, "US");
assert.equal(taxSettings.head_office?.address?.state, "TX");
const registrations = await stripe.tax.registrations
  .list({ limit: 100, status: "all" })
  .autoPagingToArray({ limit: 1000 });
const current = registrations.filter(
  (r) =>
    r.country === "US" &&
    r.country_options.us?.state === "TX" &&
    r.country_options.us.type === "state_sales_tax" &&
    r.status !== "expired",
);
assert.ok(current.length <= 1, "Multiple Texas registrations require review");
function verify(r: Stripe.Tax.Registration) {
  assert.equal(r.livemode, true);
  assert.equal(r.country, params.country);
  assert.equal(r.country_options.us?.state, "TX");
  assert.equal(r.country_options.us?.type, "state_sales_tax");
  assert.equal(r.active_from, activeFrom);
  assert.equal(r.expires_at, null);
  assert.equal(
    r.status,
    Date.now() / 1000 < activeFrom ? "scheduled" : "active",
  );
}
if (current[0]) verify(current[0]);
const changeNeeded = current.length === 0;
if (changeNeeded)
  assert.ok(
    activeFrom > Date.now() / 1000,
    "New registration must be future-dated",
  );
const dir = `artifacts/texas-tax-registration-2026-11-14/${Date.now()}-${apply ? "apply" : "preview"}`;
await mkdir(dir, { recursive: true });
await writeFile(
  `${dir}/before.json`,
  JSON.stringify(
    { checkedAt: new Date().toISOString(), registrations },
    null,
    2,
  ),
);
const plan = {
  mode: apply ? "apply" : "preview",
  expectedAccountVerified: true,
  changeNeeded,
  registration: params,
  startsTexasTime: "November 23, 2026 at 12:00 AM CST (America/Chicago)",
  startsUtc: new Date(activeFrom * 1000).toISOString(),
  checkoutModeChanged: false,
  productTaxCodesChanged: false,
};
await writeFile(`${dir}/plan.json`, JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));
if (!apply) process.exit(0);
let registration = current[0];
if (changeNeeded) {
  registration = await stripe.tax.registrations.create(params, {
    idempotencyKey: "simbiat-tx-state-sales-tax-2026-11-23-v1",
  });
  // Save immediately before the independent read-back.
  await writeFile(`${dir}/created.json`, JSON.stringify(registration, null, 2));
}
assert.ok(registration);
const verified = await stripe.tax.registrations.retrieve(registration.id);
verify(verified);
const after = await stripe.tax.registrations
  .list({ limit: 100, status: "all" })
  .autoPagingToArray({ limit: 1000 });
assert.equal(after.length, registrations.length + (changeNeeded ? 1 : 0));
for (const prior of registrations)
  assert.deepEqual(
    after.find((r) => r.id === prior.id),
    prior,
  );
assert.equal(
  after.filter(
    (r) =>
      r.country === "US" &&
      r.country_options.us?.state === "TX" &&
      r.country_options.us?.type === "state_sales_tax" &&
      r.status !== "expired",
  ).length,
  1,
);
const result = {
  verifiedAt: new Date().toISOString(),
  id: verified.id,
  status: verified.status,
  livemode: verified.livemode,
  country: verified.country,
  state: verified.country_options.us?.state,
  type: verified.country_options.us?.type,
  activeFromUtc: new Date(verified.active_from * 1000).toISOString(),
  created: changeNeeded,
  otherRegistrationsPreserved: true,
  checkoutModeChanged: false,
};
await writeFile(`${dir}/verified.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
