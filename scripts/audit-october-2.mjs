// Fresh, read-only verification for the client proof PDF. No orders or submissions.
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { products, photos, story } from "./contentful/october-2-content.mjs";
import { management, environmentPath } from "./contentful/management.mjs";
import { setDefaultResultOrder } from "node:dns";

setDefaultResultOrder("ipv4first");
const folder = "artifacts/client-feedback-2026-10-02/proof";
await mkdir(folder, { recursive: true });
const report = {
  checkedAt: new Date().toISOString(),
  checks: [],
  captures: {},
  files: [],
};
async function check(environment, width, name, work) {
  try {
    const detail = await work();
    report.checks.push({ environment, width, name, status: "PASS", detail });
    console.log(`PASS ${environment} ${width || ""} ${name}`);
  } catch (error) {
    report.checks.push({
      environment,
      width,
      name,
      status: "FAIL",
      detail: error.message.slice(0, 1500),
    });
    console.log(
      `FAIL ${environment} ${width || ""} ${name}: ${error.message.split("\n")[0]}`,
    );
  }
  await writeFile(`${folder}/audit.json`, JSON.stringify(report, null, 2));
}
for (const directory of [
  "public/assets/2 oktober",
  "public/assets/2 oct - second",
]) {
  for (const filename of await readdir(directory)) {
    const bytes = await readFile(`${directory}/${filename}`);
    report.files.push({
      directory,
      filename,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
}
await check("CMS", null, "Published content matches both emails", async () => {
  const data = await management(environmentPath + "/entries?limit=1000");
  assert.ok(data.items.length >= data.total, "Incomplete CMS collection");
  const f = (e) =>
    Object.fromEntries(
      Object.entries(e.fields).map(([k, v]) => [k, v["en-US"]]),
    );
  const rows = data.items.map((e) => ({ ...f(e), sys: e.sys }));
  const published = (e) =>
    assert.equal(e.sys.version, e.sys.publishedVersion + 1);
  for (const product of products) {
    const entry = rows.find(
      (e) =>
        e.sys.contentType.sys.id === "pantryProduct" && e.slug === product.slug,
    );
    published(entry);
    assert.equal(entry.name, product.name);
    assert.equal(entry.description, product.description);
    const variants = rows.filter(
      (e) =>
        e.sys.contentType.sys.id === "pantryVariant" &&
        e.product?.sys.id === entry.sys.id &&
        e.active,
    );
    assert.equal(variants.length, product.variants.length);
    for (const variant of product.variants) {
      const actual = variants.find((v) => v.size === variant.size);
      published(actual);
      assert.equal(actual.priceCents, variant.priceCents);
    }
  }
  const article = rows.find((e) => e.slug === story.slug);
  published(article);
  assert.equal(article.author, "Simbiat");
  assert.deepEqual(
    article.sectionRefs.map(
      (ref) => rows.find((e) => e.sys.id === ref.sys.id).text,
    ),
    story.paragraphs,
  );
  const recipe = rows.find((e) => e.slug === "egusi-greens");
  published(recipe);
  assert.equal(recipe.image.sys.id, "pantry-asset-3c6d1836866bb095f1c33565");
  assert.equal(recipe.approvalStatus, "sample");
  return "Four published products; six exact prices; nine exact story paragraphs; published recipe photo; recipe remains sample content.";
});
const browser = await chromium.launch();
try {
  for (const [environment, origin] of [
    ["live", "https://www.iyayusufspantry.com"],
    ["local", "http://localhost:3106"],
  ]) {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      async function visit(path) {
        const response = await page.goto(origin + path, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        assert.equal(response.status(), 200, path);
        await expect(page.locator("h1")).toBeVisible();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "Horizontal overflow",
        );
      }
      async function capture(key, locator) {
        const name = `${environment}-${width}-${key}.png`;
        await locator.screenshot({
          path: `${folder}/${name}`,
          animations: "disabled",
          style: "[data-sonner-toaster] { visibility: hidden; }",
        });
        report.captures[`${environment}-${width}-${key}`] = name;
      }
      await check(
        environment,
        width,
        "Homepage recipe photograph",
        async () => {
          await visit("/");
          const card = page
            .locator(".editorial-card")
            .filter({ hasText: "A comforting bowl of egusi" });
          const image = card.locator("img");
          await expect(image).toHaveAttribute(
            "alt",
            "A close-up of a bowl of egusi soup with leafy greens on a stone counter.",
          );
          await image.scrollIntoViewIfNeeded();
          await image.evaluate((img) =>
            Promise.race([
              img.decode(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Image decode timeout")),
                  15000,
                ),
              ),
            ]),
          );
          await capture("recipe-card", card);
        },
      );
      await check(
        environment,
        width,
        "Footer logo returns to homepage top",
        async () => {
          await page.locator("footer .wordmark").scrollIntoViewIfNeeded();
          const before = await page.evaluate(() => scrollY);
          await capture("logo-before", page.locator("footer"));
          const href = await page
            .locator("footer .wordmark")
            .getAttribute("href");
          await page.locator("footer .wordmark").click();
          await expect
            .poll(() => page.evaluate(() => scrollY), { timeout: 6000 })
            .toBe(0);
          await capture("logo-after", page.locator(".home-hero"));
          return {
            href,
            scrollBefore: before,
            scrollAfter: await page.evaluate(() => scrollY),
          };
        },
      );
      await check(
        environment,
        width,
        "Repeated logo click and cross-page navigation",
        async () => {
          for (const route of ["/", "/shop"]) {
            await visit(route);
            for (let click = 0; click < 2; click++) {
              await page.locator("footer .wordmark").click();
              await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
              assert.equal(new URL(page.url()).pathname, "/");
            }
          }
          await page.evaluate(() => scrollTo(0, 650));
          await page.locator("header .wordmark").click();
          await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
          if (width === 390) {
            await page.locator("button[aria-controls='mobile-menu']").click();
            await expect(page.locator("#mobile-menu")).toBeVisible();
            await page.locator("header .wordmark").click();
            await expect(page.locator("#mobile-menu")).toHaveCount(0);
          }
        },
      );
      await check(environment, width, "Complete story in journal", async () => {
        await visit(`/blog/${story.slug}`);
        await expect(page.locator("h1")).toHaveText(story.title);
        await expect(page.locator(".article-byline")).toHaveText("By Simbiat");
        assert.deepEqual(
          await page.locator(".article-body > section > p").allTextContents(),
          story.paragraphs,
        );
        await capture("story-heading", page.locator(".editorial-heading"));
        await capture("story-body", page.locator(".article-body"));
      });
      await check(
        environment,
        width,
        "Complete story on community page",
        async () => {
          await visit("/stories");
          const article = page
            .locator("article")
            .filter({ has: page.getByRole("heading", { name: story.title }) });
          await expect(article).toBeVisible({ timeout: 5000 });
          assert.deepEqual(
            await article.locator("section > p").allTextContents(),
            story.paragraphs,
          );
          await capture("community-story", article);
        },
      );
      for (const product of products) {
        await check(
          environment,
          width,
          product.name + " / photo, wording and prices",
          async () => {
            await visit(`/shop/${product.slug}`);
            await expect(page.locator("h1")).toHaveText(product.name);
            await expect(page.locator(".product-detail-copy")).toContainText(
              product.description,
            );
            const image = page.locator(".product-main-image img");
            await expect(image).toHaveAttribute(
              "alt",
              photos[product.photos[0]][1],
            );
            await image.scrollIntoViewIfNeeded();
            await image.evaluate((img) =>
              Promise.race([
                img.decode(),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Image decode timeout")),
                    15000,
                  ),
                ),
              ]),
            );
            for (const variant of product.variants) {
              if (product.variants.length > 1)
                await page
                  .getByRole("button", { name: variant.size, exact: true })
                  .click();
              await expect(
                page.locator(".product-detail-copy .text-2xl"),
              ).toHaveText(`$${(variant.priceCents / 100).toFixed(2)}`);
              await capture(
                `${product.slug}-${variant.size.replaceAll(" ", "-")}`,
                width === 1440
                  ? page.locator(".product-detail-grid")
                  : page.locator(".product-detail-copy"),
              );
              await page
                .getByRole("button", { name: "Add to cart", exact: true })
                .click();
              await expect(
                page.locator("[data-sonner-toast]").last(),
              ).toContainText(product.name);
            }
            return product.variants;
          },
        );
      }
      await check(
        environment,
        width,
        "Six-item cart, persistence and server subtotal",
        async () => {
          await visit("/cart");
          await expect(page.locator(".cart-item")).toHaveCount(6);
          await expect(page.locator(".summary-totals dd").first()).toHaveText(
            "$76.00",
          );
          await page.reload({ waitUntil: "domcontentloaded" });
          await expect(page.locator(".summary-totals dd").first()).toHaveText(
            "$76.00",
          );
          await capture("cart", page.locator("main"));
          const response = await page.request.post(
            origin + "/api/cart/review",
            {
              data: {
                items: products.flatMap((p) =>
                  p.variants.map((v) => ({
                    variantId: `${p.slug}:${v.size}:Standard`,
                    quantity: 1,
                  })),
                ),
              },
            },
          );
          assert.equal(response.status(), 200);
          const quote = await response.json();
          assert.equal(quote.subtotalCents, 7600);
          return {
            subtotalCents: quote.subtotalCents,
            items: quote.lines.length,
            paymentEnabled: quote.paymentEnabled,
          };
        },
      );
      await check(
        environment,
        width,
        "Recipe photo on listing, detail and product recommendation",
        async () => {
          for (const route of [
            "/recipes",
            "/recipes/egusi-greens",
            "/shop/ground-egusi",
          ]) {
            await visit(route);
            const image = page
              .getByAltText(
                "A close-up of a bowl of egusi soup with leafy greens on a stone counter.",
              )
              .first();
            await expect(image).toHaveCount(1);
            await image.scrollIntoViewIfNeeded();
            await image.evaluate((img) =>
              Promise.race([
                img.decode(),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error("Image decode timeout")),
                    15000,
                  ),
                ),
              ]),
            );
            if (route === "/recipes/egusi-greens")
              await capture("recipe-hero", page.locator(".editorial-hero"));
          }
        },
      );
      await check(environment, width, "No uncaught browser errors", async () =>
        assert.deepEqual(errors, []),
      );
      await page.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(`${folder}/audit.json`, JSON.stringify(report, null, 2));
}
console.log(
  `Saved ${report.checks.length} checks and ${Object.keys(report.captures).length} captures to ${folder}.`,
);
