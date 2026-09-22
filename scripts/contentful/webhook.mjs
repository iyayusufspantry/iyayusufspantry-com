import { randomBytes } from "node:crypto";
import { appendFile } from "node:fs/promises";
import path from "node:path";
import { management, environment } from "./management.mjs";
import { root } from "./export.mjs";

// Loading env is handled by management.mjs; never print or read credential files.
let secret = process.env.CONTENTFUL_REVALIDATION_SECRET;
if (!secret) {
  secret = randomBytes(32).toString("hex");
  await appendFile(
    path.join(root, ".env"),
    `\nCONTENTFUL_REVALIDATION_SECRET=${secret}\n`,
  );
  console.log(
    "Generated CONTENTFUL_REVALIDATION_SECRET in .env (value hidden).",
  );
}
const argument = process.argv.indexOf("--url");
if (argument < 0) {
  console.log(
    "Secret ready. Deploy the app with this secret, then run npm run contentful:webhook -- --url https://your-site.example",
  );
  process.exit(0);
}
const site = new URL(process.argv[argument + 1]);
if (
  site.protocol !== "https:" ||
  site.username ||
  site.password ||
  site.search ||
  site.hash ||
  /^(localhost|127\.|0\.|\[::1\])/.test(site.hostname)
)
  throw new Error("Use the public HTTPS website origin");
const endpoint = new URL("/api/contentful/revalidate", site).href;
const probe = await fetch(endpoint, {
  method: "POST",
  signal: AbortSignal.timeout(15000),
  redirect: "error",
});
if (probe.status !== 401)
  throw new Error(
    `Deploy the webhook route and secret first (endpoint returned ${probe.status}, expected 401)`,
  );
const authenticatedProbe = await fetch(endpoint, {
  method: "POST",
  headers: {
    "X-Contentful-Webhook-Secret": secret,
    "Content-Type": "application/json",
  },
  body: "{}",
  signal: AbortSignal.timeout(15000),
  redirect: "error",
});
if (authenticatedProbe.status !== 400)
  throw new Error(
    "The deployed revalidation secret does not match the local secret, or the endpoint is unavailable",
  );
const hooks = await management("/webhook_definitions");
const name = `Iya Yusuf's Pantry revalidation (${environment})`;
const existing = hooks.items.find((h) => h.name === name);
const body = {
  name,
  url: endpoint,
  httpBasicUsername: "",
  httpBasicPassword: "",
  topics: [
    "Entry.publish",
    "Entry.unpublish",
    "Entry.delete",
    "Asset.publish",
    "Asset.unpublish",
    "Asset.delete",
  ],
  filters: [{ equals: [{ doc: "sys.environment.sys.id" }, environment] }],
  headers: [
    { key: "X-Contentful-Webhook-Secret", value: secret, secret: true },
  ],
  active: true,
};
await management(
  `/webhook_definitions${existing ? `/${existing.sys.id}` : ""}`,
  { method: existing ? "PUT" : "POST", body, version: existing?.sys.version },
);
console.log(`Contentful webhook configured: ${endpoint}`);
