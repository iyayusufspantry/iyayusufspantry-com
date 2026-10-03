// Build a self-contained PDF from the fresh audit, without changing the website.
import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { products, story } from "./contentful/october-2-content.mjs";

const evidence = "artifacts/client-feedback-2026-10-02/proof";
const audit = JSON.parse(await readFile(`${evidence}/audit.json`, "utf8"));
if (audit.checks.length !== 49)
  throw new Error("Run the complete audit before exporting the proof.");
const output = "artifacts/pdf/Iya-Yusufs-Pantry-October-2-Proof-Revised";
await mkdir("artifacts/pdf", { recursive: true });
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const timestamp = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Makassar",
}).format(new Date(audit.checkedAt));
const pages = [];
function add(title, subtitle, body) {
  pages.push(
    `<section class="page" id="page-${pages.length + 1}"><header><span>IYA YUSUF’S PANTRY</span><span>OCTOBER 2 · CLIENT UPDATE PROOF</span></header><div class="content"><h1>${title}</h1><p class="subtitle">${subtitle}</p>${body}</div><footer><span>Checked ${timestamp} WITA (UTC+8)</span><span>${pages.length + 1} / TOTALPAGES</span></footer></section>`,
  );
}
async function imageData(file) {
  const bytes = await readFile(file);
  return `data:image/${bytes[0] === 137 ? "png" : "jpeg"};base64,${bytes.toString("base64")}`;
}
async function shot(key, caption, css = "") {
  const filename = audit.captures[key];
  if (!filename)
    return `<div class="notice">Screenshot unavailable: ${escape(key)}. See recorded test result.</div>`;
  const bytes = await readFile(`${evidence}/${filename}`);
  const ratio = bytes.readUInt32BE(16) / bytes.readUInt32BE(20);
  return `<figure><div class="image-box ${css}" style="--image-ratio:${ratio}"><img src="${await imageData(`${evidence}/${filename}`)}" alt="${escape(caption)}"></div><figcaption>${escape(caption)}</figcaption></figure>`;
}
const link = (route) =>
  `<a href="https://www.iyayusufspantry.com${route}">www.iyayusufspantry.com${route}</a>`;
const pending = '<span class="badge pending">DEPLOYMENT PENDING</span>';
const passed = '<span class="badge">VERIFIED</span>';
const result = (env, width, name) =>
  audit.checks.find(
    (c) => c.environment === env && c.width === width && c.name === name,
  );
const failures = audit.checks.filter((c) => c.status === "FAIL");
const expectedGaps = new Set([
  "Footer logo returns to homepage top",
  "Repeated logo click and cross-page navigation",
  "Complete story on community page",
]);
if (
  failures.length !== 6 ||
  failures.some((c) => c.environment !== "live" || !expectedGaps.has(c.name))
)
  throw new Error(
    "Audit outcomes changed. Update the report narrative before exporting.",
  );

add(
  "Both emails, checked item by item",
  "Fresh desktop and mobile evidence · live website and local production build",
  `
  <div class="notice"><strong>Two changes still need deployment.</strong> The logo fix and the story’s community-page display pass locally but fail on the current live website. The product updates, journal story and egusi soup photograph are live.</div>
  <table><thead><tr><th>Client request</th><th>Current result</th><th>Evidence</th></tr></thead><tbody>
  <tr><td>1. Rediscovering the Taste of Home</td><td>Journal live; community page pending deployment</td><td>Pages 2–3</td></tr>
  <tr><td>2. Banner / logo returns to homepage top</td><td>Fixed and verified locally; still fails live</td><td>Page 4</td></tr>
  <tr><td>3. Whole Egusi: $3/oz or $20/lb</td><td>Live: correct photo, description and both prices</td><td>Page 5</td></tr>
  <tr><td>4. Whole Ogbono: $3/oz or $20/lb</td><td>Live: correct photo, description and both prices</td><td>Page 6</td></tr>
  <tr><td>5. Smoked Catfish: $25/lb</td><td>Live: correct photo, description and price</td><td>Page 7</td></tr>
  <tr><td>6. Smoked Large Red Crayfish: $5/oz</td><td>Live: correct photo, description and price</td><td>Page 8</td></tr>
  <tr><td>7. Optional extra drink photograph</td><td>Retained in supplied files for future use</td><td>Page 11</td></tr>
  <tr><td>8. Three more spice products</td><td>Awaiting client content</td><td>Page 12</td></tr>
  <tr><td>Paid drink recipe recommendations</td><td>Recommendation provided; sales not activated</td><td>Page 12</td></tr>
  <tr><td>Second email: egusi soup placeholder</td><td>Live on homepage, recipe pages and related card</td><td>Page 9</td></tr>
  </tbody></table>
  <p class="small">Scope: every request in the two supplied emails. This is a content and browser behavior audit, not a complete store-launch certification. No orders, payments, emails or story submissions were created.</p>`,
);

add(
  "The complete community story",
  "Item 1 · journal wording verified against all nine supplied paragraphs",
  `
  <div class="row"><div><h2>${story.title}</h2><p>By Simbiat · ${link(`/blog/${story.slug}`)}</p></div>${passed}</div>
  <div class="story-transcript">${story.paragraphs.map((paragraph, index) => `<p><sup>${index + 1}</sup>${escape(paragraph)}</p>`).join("")}</div>
  <div class="note"><strong>Verification:</strong> exact paragraph text and order matched the published CMS entry and live journal at both 1440px and 390px. The text above is a readable transcript; the next page supplies browser screenshots.</div>`,
);

add(
  "Story evidence and community display",
  "Item 1 · live journal plus the prepared community page",
  `
  <div class="row top"><div class="wide">${await shot("live-1440-story-heading", "LIVE · journal title, author and publication details", "heading-shot")}${await shot("local-1440-community-story", "LOCAL BUILD · upper portion of /stories; full text verified separately", "crop community")}</div><div class="narrow"><div class="notice">${pending}<p>The story is absent from the live <strong>/stories</strong> page. It is present in the local production build.</p></div>${await shot("local-390-community-story", "LOCAL BUILD · mobile community story, upper portion", "crop mobile-community")}</div></div>
  <p class="small">Full original wording is on page 2. Screenshot crops show placement and typography. Visitor submissions and moderation were not exercised in this audit.</p>`,
);

const scrollRows = [1440, 390]
  .map((width) => {
    const row = result("local", width, "Footer logo returns to homepage top");
    return `<tr><td>${width}px</td><td>${row?.detail?.scrollBefore ?? "—"}px</td><td>${row?.detail?.scrollAfter ?? "—"}px</td><td>${row?.status ?? "Missing"}</td></tr>`;
  })
  .join("");
add(
  "The logo fix works locally",
  "Item 2 · the live website still needs the updated application",
  `
  <div class="row"><div class="half">${await shot("local-1440-logo-before", "LOCAL BUILD · footer logo before clicking", "footer-shot")}${await shot("local-1440-logo-after", "LOCAL BUILD · homepage hero after clicking", "hero-shot")}</div><div class="half"><div class="notice">${pending}<p><strong>Live:</strong> the same-page logo checks fail on desktop and mobile.<br><strong>Local:</strong> homepage return, repeated clicks, cross-page return and mobile-menu closure pass.</p></div><h2>Measured scroll position</h2><table><tr><th>Viewport</th><th>Before</th><th>After</th><th>Result</th></tr>${scrollRows}</table><h2>Checked behavior</h2><ul><li>Footer logo returns to the top from the homepage.</li><li>Clicking it again after scrolling down still works.</li><li>Clicking it from the shop returns home at the top.</li><li>Header logo returns to the top.</li><li>Header logo closes the open mobile menu.</li></ul><p>The existing link target was insufficient for repeated same-page navigation. The prepared fix uses a top anchor and explicit scrolling.</p></div></div>`,
);

for (const [index, product] of products.entries()) {
  const first = product.variants[0];
  const last = product.variants.at(-1);
  const key = (variant) =>
    `${product.slug}-${variant.size.replaceAll(" ", "-")}`;
  add(
    product.name,
    `Item ${index + 3} · live product evidence · ${product.variants.map((v) => `${money(v.priceCents)} / ${v.size}`).join(" · ")}`,
    `
    <p class="url">${link(`/shop/${product.slug}`)} ${passed}</p>
    <div class="row top"><div class="wide">${await shot(`live-1440-${key(first)}`, `LIVE · desktop with ${first.size} selected`, "product-desktop")}<div class="quote"><strong>Verified description</strong><p>${escape(product.description)}</p></div></div><div class="narrow">${await shot(`live-390-${key(last)}`, `LIVE · mobile with ${last.size} selected`, "product-mobile")}<table><tr><th>Size</th><th>Price</th></tr>${product.variants.map((v) => `<tr><td>${v.size}</td><td>${money(v.priceCents)}</td></tr>`).join("")}</table></div></div>
    <p class="small">Photo, exact description, selected price and add-to-cart behavior passed on desktop and mobile, live and locally. Existing product URLs remain intact. This is the existing store prototype; this report does not certify payment or shipping readiness.</p>`,
  );
}

add(
  "Egusi soup placeholder is live",
  "Second email · the close-up bowl now replaces the recipe illustration",
  `
  <div class="row top"><div style="width:370px">${await shot("live-1440-recipe-card", "LIVE · homepage recipe card, desktop", "recipe-card")}</div><div style="flex:1">${await shot("live-1440-recipe-hero", "LIVE · recipe detail image", "recipe-hero")}<h2>Verified image placements</h2><table><tr><th>Location</th><th>Desktop</th><th>Mobile</th></tr><tr><td>Homepage recipe card</td><td>PASS</td><td>PASS</td></tr><tr><td>Recipe listing</td><td>PASS</td><td>PASS</td></tr><tr><td>Egusi recipe detail</td><td>PASS</td><td>PASS</td></tr><tr><td>Egusi product’s related recipe</td><td>PASS</td><td>PASS</td></tr></table><p>Source: <strong>1790911898722blob.jpg</strong></p><p>${link("/recipes/egusi-greens")}</p><p class="small">The client authorized this photo as a placeholder. The existing recipe text, quantities and timing remain sample content. The alternate serving photo is retained.</p></div></div>`,
);

add(
  "Prices also agree in the cart",
  "Six variants · one of each · no checkout or payment submitted",
  `
  <div class="row top"><div style="width:400px; flex-shrink:0">${await shot("live-1440-cart", "LIVE · cart showing the six tested selections", "cart-shot")}</div><div style="flex:1"><table><tr><th>Selection</th><th>Amount</th></tr>${products.flatMap((p) => p.variants.map((v) => `<tr><td>${escape(p.name)} · ${v.size}</td><td>${money(v.priceCents)}</td></tr>`)).join("")}<tr class="total"><td>Merchandise subtotal</td><td>$76.00</td></tr></table><div class="note"><strong>Passed on all four browser runs</strong><ul><li>Six distinct cart lines.</li><li>Correct prices after size selection.</li><li>$76.00 retained after page reload.</li><li>Server cart review also returned 7,600 cents.</li></ul></div><p>The pound prices were tested as explicitly supplied. They were not calculated by multiplying the ounce price.</p><p class="small">Shipping and taxes are outside the tested merchandise subtotal. This check used the sample cart-review endpoint and did not reserve stock or place an order.</p></div></div>`,
);

const extra = await imageData(
  "public/assets/2 oct - second/1790911112946blob.jpg",
);
const alternate = await imageData(
  "public/assets/2 oct - second/1790911916139blob.jpg",
);
const reference = await imageData(
  "public/assets/2 oct - second/1790911862424blob.jpg",
);
add(
  "Every supplied image accounted for",
  "Item 7 and the second email · optional images are retained",
  `
  <div class="three"><figure><img class="asset-thumb" src="${extra}" alt="Bottled red drinks"><figcaption><strong>Optional drink photo</strong><br>1790911112946blob.jpg<br>Retained; no product identity assumed.</figcaption></figure><figure><img class="asset-thumb" src="${alternate}" alt="Egusi soup with an accompaniment"><figcaption><strong>Alternate egusi serving photo</strong><br>1790911916139blob.jpg<br>Retained; close-up used on the site.</figcaption></figure><figure><img class="asset-thumb" src="${reference}" alt="Client reference screenshot"><figcaption><strong>Client placement reference</strong><br>1790911862424blob.jpg<br>Identifies the homepage recipe card.</figcaption></figure></div>
  <table><tr><th>File</th><th>Role</th><th>Outcome</th></tr><tr><td>1790908098519blob.jpg</td><td>Footer screenshot</td><td>Used to identify the logo issue</td></tr><tr><td>1790909014944blob.jpg</td><td>Whole egusi</td><td>Published product photo</td></tr><tr><td>1790909713990blob.jpg</td><td>Whole ogbono</td><td>Published product photo</td></tr><tr><td>1790910787633blob.jpg</td><td>Smoked catfish</td><td>Published product photo</td></tr><tr><td>1790910910217blob.jpg</td><td>Smoked large red crayfish</td><td>Published product photo</td></tr><tr><td>1790911898722blob.jpg</td><td>Egusi soup close-up</td><td>Published recipe photo</td></tr></table>
  <p class="small">Both supplied folders were inventoried with file sizes and SHA-256 hashes. Repeated filenames can be compared in the companion audit.json; originals were preserved.</p>`,
);

add(
  "Remaining content and paid recipes",
  "Item 8 and the final question · recommendations, not activated features",
  `
  <div class="row top"><div class="half"><h2>What remains</h2><table><tr><th>Item</th><th>Next step</th></tr><tr><td>Logo behavior</td><td>Deploy the verified local fix</td></tr><tr><td>Story on /stories</td><td>Deploy the prepared community display</td></tr><tr><td>Three more spice products</td><td>Await names, copy, photos and prices</td></tr><tr><td>Paid drink recipes</td><td>Await recipes, step photos and final offer</td></tr><tr><td>Extra drink photograph</td><td>Confirm a placement if desired</td></tr></table><div class="notice">No additional spice products were invented. Recipe selling is not implemented or activated by these content updates.</div></div><div class="half"><h2>Recommended first recipe product</h2><p>Start with an illustrated PDF collection of three to five drinks. Include exact measurements, yield, equipment, numbered steps, photos, substitutions and troubleshooting. Have Simbiat review preparation and storage guidance.</p><p>Offer a sample page. Suggested starting experiments are <strong>$5 for a detailed recipe</strong> or <strong>$12–15 for a small collection</strong>. These are proposed test prices, not approved prices or market benchmarks.</p><h2>Simple delivery option</h2><p>Payhip supports PDF products, immediate downloads after purchase, and an emailed download link. Its free plan lists a <strong>5% transaction fee plus payment processor fees</strong>.</p><p class="small">Sources checked October 2, 2026:<br><a href="https://help.payhip.com/article/59-adding-a-digital-product">Payhip: Add Digital Products</a><br><a href="https://payhip.com/pricing">Payhip: Pricing</a></p><p class="small">The current public recipe pages do not protect paid content. Use private delivery for paid files. A future integrated checkout would require payment verification and authorized downloads.</p></div></div>`,
);

const names = [
  ...new Set(
    audit.checks.filter((c) => c.environment !== "CMS").map((c) => c.name),
  ),
];
add(
  "Full recheck results",
  `${audit.checks.length - failures.length} passed · ${failures.length} failed live checks · ${audit.checks.length} recorded checks`,
  `
  <table class="results"><tr><th>Check</th><th>Live<br>1440px</th><th>Live<br>390px</th><th>Local<br>1440px</th><th>Local<br>390px</th></tr>${names
    .map(
      (name) =>
        `<tr><td>${escape(name)}</td>${[
          ["live", 1440],
          ["live", 390],
          ["local", 1440],
          ["local", 390],
        ]
          .map(([env, width]) => {
            const c = result(env, width, name);
            return `<td class="${c.status === "PASS" ? "pass" : "fail"}">${c.status}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("")}</table>
  <div class="row"><div class="half"><h2>Additional verification</h2><ul><li>Published CMS wording, prices and photo reference: ${audit.checks[0].status}.</li><li>Fresh production build and TypeScript compilation: PASS.</li><li>Full ESLint run: PASS.</li><li>Original attachment inventory and hashes recorded.</li></ul></div><div class="half"><h2>How to interpret failures</h2><p>The six live failures cover the same two undeployed changes at two viewport sizes: two logo scenarios and the community story placement. The corresponding local checks passed.</p><p class="small">The browser checks are specific to these requests. They do not verify every site route, real payments, inventory fulfillment, tax, shipping or visitor-story submission.</p></div></div>`,
);

const unique = [...new Map(audit.files.map((f) => [f.filename, f])).values()];
add(
  "Evidence record",
  "Source files, timing and reproducibility",
  `
  <p><strong>Audit time:</strong> ${timestamp} WITA (UTC+8)<br><strong>Live origin:</strong> ${link("/")}<br><strong>Local origin:</strong> http://localhost:3106 · fresh production build with published CMS content</p>
  <table class="inventory"><tr><th>Original file</th><th>Bytes</th><th>SHA-256 prefix</th></tr>${unique.map((f) => `<tr><td>${f.filename}</td><td>${f.bytes.toLocaleString("en-US")}</td><td><code>${f.sha256.slice(0, 24)}</code></td></tr>`).join("")}</table>
  <p class="small">Full hashes, individual check outcomes, error details and screenshot filenames are preserved in <strong>artifacts/client-feedback-2026-10-02/proof/audit.json</strong>. The PDF embeds the screenshot evidence and works offline.</p>
  <div class="row"><div class="half"><h2>Reproduce the evidence</h2><p class="small">Start the local production server on port 3106, then run:</p><pre>node scripts/audit-october-2.mjs
node scripts/export-october-2-proof.mjs</pre></div><div class="half"><h2>Capture notes</h2><p class="small">Screenshots were taken in Chromium at 1440px and 390px, with reduced motion. Transient cart notification overlays were hidden only in screenshots so the product evidence remains readable. Cropped story screenshots are explicitly labeled. No publication or deployment was performed during this recheck.</p></div></div>`,
);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Iya Yusuf's Pantry — October 2 proof</title><style>
${await readFile("docs/october-2-proof.css", "utf8")}
</style></head><body>${pages.join("").replaceAll("TOTALPAGES", String(pages.length))}</body></html>`;
await writeFile(output + ".html", html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1123, height: 794 },
    deviceScaleFactor: 1,
  });
  await page.goto(
    new URL(`file:///${path.resolve(output + ".html").replaceAll("\\", "/")}`)
      .href,
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => img.decode()));
  });
  const overflow = await page.locator(".page").evaluateAll((nodes) =>
    nodes.flatMap((node) => {
      const footer = node.querySelector("footer").getBoundingClientRect();
      const content = node.querySelector(".content");
      const bounds = content.getBoundingClientRect();
      const blocks = content.querySelectorAll(
        ":scope > *, .row > div, figure, table",
      );
      const outside = [...blocks].some((block) => {
        const rect = block.getBoundingClientRect();
        return (
          rect.bottom > footer.top - 8 ||
          rect.left < bounds.left - 1 ||
          rect.right > bounds.right + 1
        );
      });
      return outside || node.scrollWidth > node.clientWidth ? [node.id] : [];
    }),
  );
  if (overflow.length)
    throw new Error(`PDF page overflow: ${overflow.join(", ")}`);
  await page.pdf({
    path: output + ".pdf",
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
  });
  for (const number of [1, 2, 3, 4, 5, 9, 13])
    await page
      .locator(`#page-${number}`)
      .screenshot({ path: `${evidence}/pdf-page-${number}.png` });
  console.log(
    `Created ${output}.pdf: ${pages.length} pages, embedded images loaded, no page overflow.`,
  );
} finally {
  await browser.close();
}
