// Export the current request audit with readable live screenshots. No writes to the site.
import { chromium, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { setDefaultResultOrder } from "node:dns";
import {
  products as initial,
  additionalSnacks,
  story as about,
} from "./contentful/september-29-content.mjs";
import { products as middle } from "./contentful/september-30-content.mjs";
import { products as latest, story } from "./contentful/october-2-content.mjs";

setDefaultResultOrder("ipv4first");
const evidence = "artifacts/client-request-recheck-2026-10-03";
const audit = JSON.parse(await readFile(`${evidence}/audit.json`, "utf8"));
const live = audit.checks.filter((c) => c.environment === "live");
if (live.length !== 54 || live.some((c) => c.status !== "PASS"))
  throw new Error("Review changed live audit outcomes before exporting.");
const products = [...initial, ...additionalSnacks, ...middle, ...latest];
const output = "artifacts/pdf/Iya-Yusufs-Pantry-Request-Review-October-3";
await mkdir("artifacts/pdf", { recursive: true });
const browser = await chromium.launch();
let supplement = {
  capturedAt: new Date().toISOString(),
  logos: [],
  variants: [],
};
try {
  if (process.argv.includes("--reuse-screenshots")) {
    supplement = JSON.parse(
      await readFile(`${evidence}/pdf-supplement.json`, "utf8"),
    );
  } else {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      async function visit(route) {
        const response = await page.goto(
          "https://www.iyayusufspantry.com" + route,
          { waitUntil: "domcontentloaded", timeout: 60000 },
        );
        if (response.status() !== 200)
          throw new Error(`Unexpected response: ${route}`);
        await expect(page.locator("h1")).toBeVisible();
      }
      async function capture(name, locator) {
        await locator.locator("img").evaluateAll(async (images) => {
          for (const img of images) {
            img.loading = "eager";
            await img.decode();
          }
        });
        await locator.screenshot({
          path: `${evidence}/proof-${width}-${name}.png`,
          animations: "disabled",
          // Element capture can scroll a product beneath the sticky header.
          style: /-\d+$/.test(name)
            ? ".site-header { visibility: hidden !important; }"
            : undefined,
        });
      }
      await visit("/");
      await capture("pantry-gallery", page.locator(".pantry-photo-grid"));
      await capture("featured-products", page.locator(".product-grid").first());
      await page.locator("footer .wordmark").scrollIntoViewIfNeeded();
      await capture("footer", page.locator("footer"));
      const before = await page.evaluate(() => scrollY);
      await page.locator("footer .wordmark").click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      supplement.logos.push({
        width,
        before,
        after: await page.evaluate(() => scrollY),
        href: await page.locator("footer .wordmark").getAttribute("href"),
      });
      await capture("logo-after", page.locator(".home-hero"));
      await visit("/stories");
      await capture("community-heading", page.locator("article").first());
      await visit("/about");
      await capture("about", page.locator(".about-hero"));
      for (const product of products) {
        await visit(`/shop/${product.slug}`);
        const thumbnails = page.locator(".gallery-thumbnails button");
        if (await thumbnails.count()) await thumbnails.first().click();
        const variants = product.variants || [
          { size: "16 oz", priceCents: product.priceCents },
        ];
        for (const [index, variant] of variants.entries()) {
          if (variants.length > 1)
            await page
              .getByRole("button", { name: variant.size, exact: true })
              .click();
          await expect(
            page.locator(".product-detail-copy .text-2xl"),
          ).toHaveText(`$${(variant.priceCents / 100).toFixed(2)}`);
          await capture(
            `${product.slug}-${index}`,
            page.locator(".product-detail-grid"),
          );
          supplement.variants.push({ width, slug: product.slug, ...variant });
        }
      }
      await page.close();
    }
    await writeFile(
      `${evidence}/pdf-supplement.json`,
      JSON.stringify(supplement, null, 2),
    );
    console.log(
      "Captured live product photos, all selected prices, and logo scroll measurements.",
    );
  }

  const escape = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const money = (cents) => `$${(cents / 100).toFixed(2)}`;
  const stamp = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Makassar",
  }).format(new Date(audit.checkedAt));
  const pages = [];
  const add = (title, subtitle, body) =>
    pages.push(
      `<section class="page" id="page-${pages.length + 1}"><header><span>IYA YUSUF’S PANTRY</span><span>CLIENT REQUEST REVIEW · OCTOBER 3, 2026</span></header><main><h1>${escape(title)}</h1><p class="subtitle">${escape(subtitle)}</p>${body}</main><footer><span>Verified ${stamp} WITA · www.iyayusufspantry.com</span><span>${pages.length + 1} / TOTAL</span></footer></section>`,
    );
  async function img(file, caption, cls = "") {
    const bytes = await readFile(file);
    const type = bytes[0] === 137 ? "png" : "jpeg";
    return `<figure class="${cls}"><img src="data:image/${type};base64,${bytes.toString("base64")}" alt="${escape(caption)}"><figcaption>${escape(caption)}</figcaption></figure>`;
  }
  const shot = (name, caption, cls = "") =>
    img(`${evidence}/${name}.png`, caption, cls);
  const url = (route) =>
    `<a href="https://www.iyayusufspantry.com${route}">www.iyayusufspantry.com${escape(route)}</a>`;
  const table = (headers, rows, cls = "") =>
    `<table class="${cls}"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  add(
    "Requested website updates are complete",
    "All 54 live desktop and mobile checks passed. Remaining follow-ups are listed separately.",
    `
    <div class="success"><strong>Live and verified:</strong> supplied photographs, both stories, all 12 products, prices, logo navigation, and the enabled shopper story form.</div>
    ${table(
      ["Simbiat’s request", "Result", "See page"],
      [
        [
          "Latest homepage banner and three replacement pantry photos",
          "Complete",
          "2",
        ],
        [
          "Visible Chin Chin / palm oil photos and latest center journal photo",
          "Complete",
          "3",
        ],
        [
          "Snack-container size reference",
          "Present in all five snack galleries",
          "3, 8–13",
        ],
        [
          "Original About Us family story",
          "All four paragraphs published",
          "4",
        ],
        [
          "Rediscovering the Taste of Home",
          "Full story on journal and community page",
          "5–6",
        ],
        [
          "Shopper form with Simbiat’s review before publication",
          "Form enabled; review workflow tests passed",
          "6",
        ],
        [
          "Logo returns to the landing-page top",
          "Desktop and mobile behavior works",
          "7",
        ],
        [
          "12 supplied products, descriptions, sizes, and prices",
          "All verified",
          "8–19",
        ],
        [
          "Egusi bowl photograph from the second email",
          "Recipe placeholder is live",
          "20",
        ],
      ],
    )}
    <div class="note"><strong>Follow-ups:</strong> await three spices and drink recipe material; confirm the recommendation was sent; manually verify Simbiat’s owner session. See page 21.</div>
    <p class="small">Review scope: the September 28–October 2 emails supplied in this conversation. Form browser requests were intercepted; no real test stories, orders, or emails were sent. This report does not certify checkout or store-launch readiness.</p>`,
  );
  add(
    "Homepage banner and replacement photos",
    "The latest assortment banner and supplied warm-background images are visible.",
    `
    <div class="cols"><div class="wide">${await shot("live-1440-homepage", "LIVE · latest banner on desktop", "hero")}${await shot("proof-1440-pantry-gallery", "LIVE · Donkwa, coconut candy, and tiger nut drink photos", "gallery")}</div><div class="narrow">${await shot("live-390-homepage", "LIVE · homepage on mobile", "mobile-hero")}</div></div>`,
  );
  add(
    "Previously missing photos and the jar reference",
    "The requested photos now load on the homepage and in snack galleries.",
    `
    ${await shot("proof-1440-featured-products", "LIVE · Chin Chin and African Red Palm Oil homepage photos", "featured")}
    <div class="cols"><div class="third">${await shot("live-1440-center-journal", "LIVE · updated center journal image", "journal-card")}</div><div class="third">${await img("public/assets/30 september/1790741198470blob.jpg", "SUPPLIED · snack-container size reference", "asset")}</div><div class="third"><h2>Container photo verified in</h2><ul><li>Chin Chin</li><li>Kuli Kuli</li><li>Donkwa / Adakwa / Tanfiri</li><li>Coconut Candy Crunch</li><li>Lightly Salted Roasted Groundnut</li></ul><p>All five reference photos decoded on desktop and mobile.</p></div></div>`,
  );
  add(
    "Original About Us family story",
    "All four supplied paragraphs are present on the live About page.",
    `
    ${await shot("proof-1440-about", "LIVE · About page with the family story", "about")}
    <div class="transcript two-columns">${about.map((p) => `<p>${escape(p)}</p>`).join("")}</div><p class="small">${url("/about")} · Complete wording verified at 1440px and 390px.</p>`,
  );
  add(
    story.title,
    "Full story transcript · exact wording and order verified on both live story pages.",
    `
    <p class="byline">By Simbiat</p><div class="transcript two-columns community-transcript">${story.paragraphs.map((p, i) => `<p><span class="paragraph-number">${i + 1}</span>${escape(p)}</p>`).join("")}</div><div class="success">Published at ${url(`/blog/${story.slug}`)} and ${url("/stories")}.</div>`,
  );
  add(
    "Community story and shopper submission form",
    "Both are live. Shopper submissions require consent and go to review.",
    `
    <div class="cols"><div class="half">${await shot("proof-1440-community-heading", "LIVE · Simbiat’s story on the community page (upper portion)", "community-crop")}<div class="note"><strong>Verified workflow:</strong><ul><li>Publication consent is required.</li><li>Failed requests retain entered text.</li><li>Retries retain the same request ID.</li><li>Confirmation promises review before publication.</li><li>Unauthenticated owner access returns HTTP 401.</li></ul></div></div><div class="half">${await shot("live-1440-story-form", "LIVE · enabled shopper form", "form")}</div></div><p class="small">Browser submission responses were intercepted. Database integration tests separately passed pending submission, publication/unpublication, privacy and stale-review checks. Simbiat’s authenticated owner session still needs a manual check.</p>`,
  );
  add(
    "The logo now returns to the top",
    "Fresh live scroll measurements confirm the footer link; navigation checks cover desktop and mobile.",
    `
    <div class="cols"><div class="half">${await shot("proof-1440-footer", "LIVE · footer logo before clicking", "footer-shot")}${await shot("proof-1440-logo-after", "LIVE · returned to the landing-page top", "logo-hero")}</div><div class="half"><h2>Measured scroll position</h2>${table(
      ["Viewport", "Before click", "After click"],
      supplement.logos.map((l) => [
        `${l.width}px`,
        `${l.before}px`,
        `${l.after}px`,
      ]),
    )}<h2>All behavior checks passed</h2><ul><li>Header logo scrolls to the top.</li><li>Footer logo scrolls to the top.</li><li>Repeated clicks still work.</li><li>Clicking from the shop returns home at the top.</li><li>Header logo closes the mobile menu.</li></ul><div class="success">Both logo links target <strong>/#top</strong>.</div><p>The old notes saying deployment was pending are historical. Current live checks pass.</p></div></div>`,
  );
  for (const product of products) {
    const variants = product.variants || [
      { size: product.unit, priceCents: product.priceCents },
    ];
    const last = variants.length - 1;
    add(
      product.name,
      "Supplied product description, photographs, size and price verified live.",
      `
      <p class="url">${url(`/shop/${product.slug}`)}</p>
      <div class="cols"><div class="wide">${await shot(`proof-1440-${product.slug}-0`, `LIVE · desktop, ${variants[0].size} at ${money(variants[0].priceCents)}`, "product-desktop")}<div class="quote"><strong>Supplied description</strong><p>${escape(product.description)}</p></div>${table(
        ["Size / packaging", "Price"],
        variants.map((v) => [
          escape(v.size === "Standard" ? product.unit : v.size),
          money(v.priceCents),
        ]),
      )}</div><div class="narrow">${await shot(`proof-390-${product.slug}-${last}`, `LIVE · mobile, ${variants[last].size} at ${money(variants[last].priceCents)}`, "product-mobile")}</div></div>
      <p class="small">Every supplied gallery image decoded on desktop and mobile. ${product.slug === "classic-chin-chin" ? "Chin Chin’s email did not specify net weight; the website uses jar." : ""} ${["classic-chin-chin", "kulikuli", "donkwa", "coconut-candy-crunch", "lightly-salted-roasted-groundnut"].includes(product.slug) ? "The shared snack-container size-reference photo is included in this gallery." : ""}</p>`,
    );
  }
  add(
    "Egusi soup placeholder and optional photos",
    "The second email’s bowl photo now appears on the homepage and recipe pages.",
    `
    <div class="cols"><div class="third">${await shot("live-1440-egusi-recipe", "LIVE · homepage egusi recipe card", "recipe-card")}</div><div class="two-thirds"><div class="success"><strong>Verified placements:</strong> homepage card, recipe listing, and egusi recipe detail, at both desktop and mobile widths.</div><p>${url("/recipes/egusi-greens")}</p><p>The image is the supplied close-up <strong>1790911898722blob.jpg</strong>. The recipe text remains sample content; Simbiat authorized the image as a placeholder.</p><div class="cols"><div class="half">${await img("public/assets/2 oct - second/1790911916139blob.jpg", "SUPPLIED · alternate soup photo retained", "optional")}</div><div class="half">${await img("public/assets/2 oktober/1790911112946blob.jpg", "SUPPLIED · optional bottled-drink photo retained", "optional")}</div></div><p class="small">These extra photos were optional. They are preserved for later use; no placement was required.</p></div></div>`,
  );
  add(
    "What still needs follow-up",
    "The supplied website edits are complete. These are content, communication, and owner-review follow-ups.",
    `
    ${table(
      ["Follow-up", "Current status", "Next action"],
      [
        [
          "Three more spice products",
          "Not supplied yet",
          "Await names, descriptions, prices, and photos from Simbiat.",
        ],
        [
          "Drink recipes and step photos",
          "Not supplied yet",
          "Await recipes, measurements, and photos before preparing the offer.",
        ],
        [
          "Recommendation for selling recipes",
          "Prepared in project notes",
          "Confirm it has been emailed to Simbiat. This audit did not send email.",
        ],
        [
          "Simbiat’s owner session",
          "Workflow code and database tests pass",
          "Manually sign in as Simbiat and review the protected story queue.",
        ],
        [
          "Paid recipe sales / digital delivery",
          "Not implemented",
          "A future feature after the recipes and delivery approach are agreed.",
        ],
      ],
    )}
    <div class="note"><h2>Prepared recipe recommendation</h2><p>Start with an illustrated downloadable PDF: exact measurements, yield, equipment, numbered steps, photographs, substitutions, and troubleshooting. Offer a sample page. A separate digital checkout is the proposed first approach.</p><p class="small">This summarizes the existing project recommendation. It is not proof of an email being sent or a paid recipe service being activated.</p></div>
    <div class="success"><strong>11 operations integration tests passed.</strong> Story-specific coverage includes consent, retry deduplication, pending review, private-email filtering, publication, unpublication, and stale-review rejection.</div><p class="small">No live story was saved and no authenticated owner session was exercised. Checks do not establish physical inventory, shipping, tax, payments, or complete store-launch readiness.</p>`,
  );
  const names = [...new Set(live.map((c) => c.name))];
  add(
    "Complete check matrix",
    "54 / 54 live checks passed · 106 total passes · 0 failures · 2 local checks skipped.",
    `
    ${table(
      ["Check", "Live desktop", "Live mobile", "Local desktop", "Local mobile"],
      names.map((name) => [
        escape(name),
        ...[
          ["live", 1440],
          ["live", 390],
          ["local", 1440],
          ["local", 390],
        ].map(
          ([env, width]) =>
            audit.checks.find(
              (c) =>
                c.name === name && c.environment === env && c.width === width,
            )?.status || "—",
        ),
      ]),
      "matrix",
    )}
    <p class="small">The two local form checks were skipped because submissions are disabled in local configuration. The live form is enabled and passed. The report uses fresh live screenshots and the saved October 3 audit; original screenshot files remain preserved.</p>`,
  );
  const css = `
    @page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;background:#e5eae7;color:#27344d;font:14px/1.45 Arial,sans-serif}.page{width:297mm;height:210mm;padding:12mm 14mm 14mm;background:#fffdf8;position:relative;break-after:page}.page:last-child{break-after:auto}header,footer{display:flex;justify-content:space-between;font-size:10px;color:#5a6e65}header{border-bottom:1px solid #ccdad2;padding-bottom:10px;margin-bottom:15px;letter-spacing:1px}footer{position:absolute;bottom:8mm;left:14mm;right:14mm;border-top:1px solid #ccdad2;padding-top:8px}h1{font:31px/1.1 Georgia,serif;margin:0 0 8px}h2{font:21px/1.2 Georgia,serif;margin:12px 0 9px}p{margin:8px 0}.subtitle{color:#617168;font-size:13px;margin:0 0 15px}a{color:#00735b;text-decoration:none}.cols{display:flex;gap:22px;align-items:flex-start}.half{width:calc(50% - 11px)}.wide{width:720px;min-width:0}.narrow{flex:1;min-width:0}.third{width:calc((100% - 44px)/3)}.two-thirds{width:calc((100% - 22px)*2/3)}figure{margin:0 0 12px}figure img{display:block;width:100%;height:auto;object-fit:contain;object-position:top;border-radius:8px}figcaption{font-size:10px;color:#607068;margin-top:5px}.hero img{max-height:320px}.gallery img{max-height:170px}.mobile-hero img{max-height:530px}.featured img{max-height:285px}.journal-card img{max-height:245px}.asset img{height:245px}.about img{max-height:315px}.community-crop img{height:230px;object-fit:cover;object-position:top}.form img{height:465px}.footer-shot img{max-height:160px}.logo-hero img{max-height:325px}.product-desktop img{max-height:380px}.product-mobile img{max-height:530px}.recipe-card img{max-height:480px}.optional img{height:280px}.transcript{font-size:14px;line-height:1.55}.two-columns{columns:2;column-gap:28px}.transcript p{break-inside:avoid;margin:0 0 13px}.community-transcript{font-size:16px;line-height:1.6;margin:12px 0 20px}.byline{font-weight:bold}.paragraph-number{font-size:10px;color:#087862;margin-right:8px}.success,.note,.quote{padding:12px 15px;border-radius:8px;margin:10px 0}.success{background:#e4f2e9;border-left:4px solid #087862}.note{background:#f3eedc}.quote{background:#eef3ee}.quote p{margin-bottom:0}table{width:100%;border-collapse:collapse;font-size:12px;margin:12px 0}th{background:#e8f0e9;text-align:left}th,td{padding:8px 10px;border-bottom:1px solid #d7dfd8;vertical-align:top}td:last-child{color:#087862}.small{font-size:11px;color:#5b685f}.url{font-size:11px;margin:0 0 12px}li{margin:7px 0}ul{padding-left:20px}.matrix{font-size:10px}.matrix th,.matrix td{padding:4px 6px}.matrix td:not(:first-child){color:#087862;font-weight:bold;white-space:nowrap}.cols>div>:first-child{margin-top:0}
  `;
  const refinements = `.featured img{max-height:240px}.journal-card img{max-height:215px}.asset img{height:215px}.product-desktop img{max-height:250px}.product-mobile img{max-height:455px}.matrix{font-size:9.5px;line-height:1.25}.matrix th,.matrix td{padding:2.5px 6px}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Iya Yusuf’s Pantry — Request Review</title><style>${css}${refinements}</style></head><body>${pages.join("").replaceAll("TOTAL", String(pages.length))}</body></html>`;
  await writeFile(output + ".html", html);
  const reportPage = await browser.newPage({
    viewport: { width: 1123, height: 794 },
  });
  await reportPage.goto(pathToFileURL(path.resolve(output + ".html")).href);
  await reportPage.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode()));
  });
  const overflow = await reportPage.locator(".page").evaluateAll((nodes) =>
    nodes.flatMap((node) => {
      const footer = node.querySelector("footer").getBoundingClientRect();
      const main = node.querySelector("main").getBoundingClientRect();
      const bad = [
        ...node.querySelectorAll("main > *, .cols > div, figure, table"),
      ].some((block) => {
        const b = block.getBoundingClientRect();
        return (
          b.bottom > footer.top - 7 ||
          b.left < main.left - 1 ||
          b.right > main.right + 1
        );
      });
      return bad || node.scrollWidth > node.clientWidth ? [node.id] : [];
    }),
  );
  if (overflow.length)
    throw new Error(`Report overflow: ${overflow.join(", ")}`);
  await reportPage.pdf({
    path: output + ".pdf",
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
  });
  for (let i = 1; i <= pages.length; i++)
    await reportPage
      .locator(`#page-${i}`)
      .screenshot({ path: `${evidence}/review-page-${i}.png` });
  await writeFile(
    `${evidence}/pdf-validation.json`,
    JSON.stringify(
      {
        pages: pages.length,
        overflow,
        liveChecks: live.length,
        generatedAt: new Date().toISOString(),
        pdf: output + ".pdf",
      },
      null,
      2,
    ),
  );
  console.log(`Created ${output}.pdf · ${pages.length} pages · no overflow.`);
} finally {
  await browser.close();
}
