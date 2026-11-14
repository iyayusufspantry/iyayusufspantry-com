// --apply creates uncharged tax estimates only: no orders, sessions or transactions.
import nextEnv from "@next/env";
import Stripe from "stripe";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { setDefaultResultOrder } from "node:dns";
import { Pool } from "pg";
import { productTax, productTaxCode } from "../../lib/payments/product-tax";

setDefaultResultOrder("ipv4first");
nextEnv.loadEnvConfig(process.cwd());
assert.ok(process.argv.slice(2).every((arg) => arg === "--apply"));
const apply = process.argv.includes("--apply");
const env = parseEnv(await readFile(".env", "utf8"));
assert.match(env.STRIPE_API_KEY || "", /^(sk|rk)_live_/);
const stripe = new Stripe(env.STRIPE_API_KEY!, {
  timeout: 20000,
  maxNetworkRetries: 2,
});
const account = await stripe.accounts.retrieve(null);
assert.equal(account.id, "acct_1UITMPHKfhrlO2yz");
assert.ok(account.charges_enabled && account.payouts_enabled);
const [settings, registrations, codes] = await Promise.all([
  stripe.tax.settings.retrieve(),
  stripe.tax.registrations
    .list({ limit: 100, status: "all" })
    .autoPagingToArray({ limit: 1000 }),
  stripe.taxCodes.list({ limit: 100 }).autoPagingToArray({ limit: 2000 }),
]);
assert.equal(settings.status, "active");
const start = Date.parse("2026-11-23T00:00:00-06:00") / 1000;
const texas = registrations.filter(
  (r) =>
    r.country === "US" &&
    r.country_options.us?.state === "TX" &&
    r.country_options.us?.type === "state_sales_tax" &&
    r.status !== "expired",
);
assert.equal(texas.length, 1);
assert.equal(texas[0].active_from, start);
assert.equal(texas[0].livemode, true);
for (const entry of Object.values(productTax)) {
  if (entry.code)
    assert.equal(
      codes.find((c) => c.id === entry.code)?.name,
      entry.category,
      `Invalid tax code/category: ${entry.code}`,
    );
}
async function collection(type: string) {
  const url = new URL(
    `https://cdn.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT || "master"}/entries`,
  );
  url.search = new URLSearchParams({
    content_type: type,
    limit: "1000",
    include: "0",
  }).toString();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.CONTENTFUL_DELIVERY_TOKEN}`,
    },
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.total, result.items.length);
  return result.items as {
    sys: { id: string };
    fields: Record<string, unknown>;
  }[];
}
const [products, variants, categories] = await Promise.all([
  collection("pantryProduct"),
  collection("pantryVariant"),
  collection("pantryCategory"),
]);
const categoryIds = new Set(categories.map((c) => c.sys.id));
const storefrontProducts = products.filter((p) =>
  categoryIds.has(
    (p.fields.category as { sys?: { id?: string } })?.sys?.id || "",
  ),
);
const storefrontIds = new Set(storefrontProducts.map((p) => p.sys.id));
const publishedActive = variants.filter(
  (v) =>
    v.fields.active === true &&
    storefrontIds.has(
      (v.fields.product as { sys?: { id?: string } })?.sys?.id || "",
    ),
);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 1,
});
let liveIds: Set<string>;
try {
  await pool.query("BEGIN READ ONLY");
  const stock = await pool.query<{ variant_id: string }>(
    "SELECT variant_id FROM simbiat_checkout_live.stock",
  );
  liveIds = new Set(stock.rows.map((r) => r.variant_id));
  await pool.query("ROLLBACK");
} finally {
  await pool.end();
}
const active = publishedActive.filter((v) =>
  liveIds.has(String(v.fields.variantId)),
);
const counts: Record<string, number> = {};
for (const v of active) {
  const productId = (v.fields.product as { sys?: { id?: string } })?.sys?.id;
  const slug = products.find((p) => p.sys.id === productId)?.fields.slug;
  assert.equal(typeof slug, "string");
  counts[String(slug)] = (counts[String(slug)] || 0) + 1;
}
const pending = Object.entries(counts)
  .filter(
    ([slug]) => !Object.hasOwn(productTax, slug) || !productTax[slug].code,
  )
  .map(([slug, count]) => ({
    slug,
    variants: count,
    review: productTax[slug]?.review || "New product requires review",
  }));
const plan = {
  mode: apply ? "apply" : "preview",
  registrationStatus: texas[0].status,
  startsUtc: new Date(start * 1000).toISOString(),
  activeVariants: active.length,
  publishedActiveVariants: publishedActive.length,
  variantsWithoutPreparedLiveStock: publishedActive
    .filter((v) => !liveIds.has(String(v.fields.variantId)))
    .map((v) => v.fields.variantId),
  codedVariants: active.length - pending.reduce((n, p) => n + p.variants, 0),
  pending,
  noPayment: true,
  noTaxTransaction: true,
};
console.log(JSON.stringify(plan, null, 2));
if (!apply) process.exit(0);
assert.ok(
  start > Date.now() / 1000,
  "Pre-start verification is only valid before the scheduled start",
);
const office = settings.head_office?.address;
assert.ok(
  office?.line1 &&
    office.postal_code &&
    office.state === "TX" &&
    office.country === "US",
);
const address = {
  line1: office.line1,
  line2: office.line2 || undefined,
  city: office.city || undefined,
  state: "TX",
  postal_code: office.postal_code,
  country: "US",
};
const folder = `artifacts/tax-integration-2026-11-14/${Date.now()}`;
await mkdir(folder, { recursive: true });
await writeFile(`${folder}/plan.json`, JSON.stringify(plan, null, 2));
type Item = { slug: string; amount: number };
const cases: {
  name: string;
  items: Item[];
  date: number;
  outside?: boolean;
  expectTax: boolean;
}[] = [
  {
    name: "before-registration",
    items: [{ slug: "pantry-people-cap", amount: 3500 }],
    date: Math.floor(Date.now() / 1000),
    expectTax: false,
  },
  {
    name: "exempt-grocery",
    items: [{ slug: "palm-oil", amount: 2500 }],
    date: start + 3600,
    expectTax: false,
  },
  {
    name: "taxable-apparel",
    items: [{ slug: "pantry-people-cap", amount: 3500 }],
    date: start + 3600,
    expectTax: true,
  },
  {
    name: "mixed-cart",
    items: [
      { slug: "palm-oil", amount: 1000 },
      { slug: "pantry-people-cap", amount: 3500 },
    ],
    date: start + 3600,
    expectTax: true,
  },
  {
    name: "free-shipping-at-60",
    items: [
      { slug: "pantry-people-cap", amount: 3500 },
      { slug: "my-roots-have-flavor-shirt", amount: 2500 },
    ],
    date: start + 3600,
    expectTax: true,
  },
  {
    name: "unregistered-california",
    items: [{ slug: "pantry-people-cap", amount: 3500 }],
    date: start + 3600,
    outside: true,
    expectTax: false,
  },
];
assert.ok(
  !registrations.some(
    (r) =>
      r.country === "US" &&
      r.country_options.us?.state === "CA" &&
      r.status !== "expired",
  ),
  "California case assumes no registration",
);
const results = [];
for (const scenario of cases) {
  const subtotal = scenario.items.reduce((n, item) => n + item.amount, 0);
  const shipping = subtotal < 6000 ? 699 : 0;
  const calculation = await stripe.tax.calculations.create(
    {
      currency: "usd",
      customer_details: {
        address: scenario.outside
          ? {
              line1: "354 Oyster Point Blvd",
              city: "South San Francisco",
              state: "CA",
              postal_code: "94080",
              country: "US",
            }
          : address,
        address_source: "shipping",
      },
      ship_from_details: { address },
      line_items: scenario.items.map((item) => ({
        reference: item.slug,
        amount: item.amount,
        quantity: 1,
        tax_behavior: "exclusive",
        tax_code: productTaxCode(item.slug),
      })),
      shipping_cost: { amount: shipping, tax_behavior: "exclusive" },
      tax_date: scenario.date,
      expand: ["line_items.data.tax_breakdown", "shipping_cost.tax_breakdown"],
    },
    {
      idempotencyKey: `simbiat-tax-check-${scenario.name}-${folder.split("/").at(-1)}`,
    },
  );
  await writeFile(
    `${folder}/${scenario.name}.json`,
    JSON.stringify(calculation, null, 2),
  );
  assert.equal(calculation.livemode, true);
  assert.equal(calculation.tax_amount_inclusive, 0);
  assert.equal(
    calculation.amount_total,
    subtotal + shipping + calculation.tax_amount_exclusive,
  );
  assert.equal(
    calculation.tax_amount_exclusive > 0,
    scenario.expectTax,
    `${scenario.name}: unexpected tax result`,
  );
  const lines = calculation.line_items?.data || [];
  assert.equal(lines.length, scenario.items.length);
  for (const item of scenario.items) {
    const line = lines.find((l) => l.reference === item.slug);
    assert.equal(line?.tax_code, productTaxCode(item.slug));
    assert.equal(line?.amount, item.amount);
  }
  if (scenario.name === "mixed-cart") {
    assert.equal(lines.find((l) => l.reference === "palm-oil")?.amount_tax, 0);
    assert.ok(
      (lines.find((l) => l.reference === "pantry-people-cap")?.amount_tax ||
        0) > 0,
    );
  }
  if (scenario.name === "taxable-apparel")
    assert.ok((calculation.shipping_cost?.amount_tax || 0) > 0);
  if (shipping === 0)
    assert.equal(calculation.shipping_cost?.amount_tax || 0, 0);
  const result = {
    name: scenario.name,
    id: calculation.id,
    subtotal,
    shipping,
    tax: calculation.tax_amount_exclusive,
    shippingTax: calculation.shipping_cost?.amount_tax || 0,
    total: calculation.amount_total,
    passed: true,
  };
  results.push(result);
  console.log(JSON.stringify(result));
}
await writeFile(
  `${folder}/verified.json`,
  JSON.stringify(
    { verifiedAt: new Date().toISOString(), ...plan, results },
    null,
    2,
  ),
);
