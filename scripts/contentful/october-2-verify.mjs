// Read-only browser checks; cart selections stay in the local browser tab.
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { products, photos, story } from "./october-2-content.mjs";

const origin = process.argv[2] || "http://localhost:3100";
const folder = "artifacts/client-feedback-2026-10-02/browser";
await mkdir(folder, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    async function visit(path) {
      const response = await page.goto(origin + path);
      assert.equal(response.status(), 200, path);
      await page.locator("h1").waitFor();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    for (const path of ["/", "/shop"]) {
      await visit(path);
      await page.locator("footer .wordmark").click();
      await expect(page).toHaveURL(origin + "/#top");
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      // Repeated navigation to the same fragment must also reset the scroll.
      await page.locator("footer .wordmark").click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    }
    await page.evaluate(() => scrollTo(0, 700));
    await page.locator("header .wordmark").click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    if (width === 390) {
      await page.locator("button[aria-controls='mobile-menu']").click();
      await expect(page.locator("#mobile-menu")).toBeVisible();
      await page.locator("header .wordmark").click();
      await expect(page.locator("#mobile-menu")).toHaveCount(0);
    }
    await visit("/stories");
    const article = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: story.title }) });
    await expect(article).toContainText("By Simbiat");
    for (const paragraph of story.paragraphs)
      await expect(article).toContainText(paragraph);
    await page.screenshot({
      path: `${folder}/${width}-story.png`,
      fullPage: true,
    });
    await visit(`/blog/${story.slug}`);
    await expect(page.locator("h1")).toHaveText(story.title);
    for (const paragraph of story.paragraphs)
      await expect(page.locator(".article-body")).toContainText(paragraph);
    for (const product of products) {
      await visit(`/shop/${product.slug}`);
      await expect(page.locator("h1")).toHaveText(product.name);
      await expect(page.locator(".product-detail-copy")).toContainText(
        product.description,
      );
      const photo = page.locator(".product-main-image img");
      await expect(photo).toHaveAttribute("alt", photos[product.photos[0]][1]);
      await photo.evaluate((image) => image.decode());
      for (const variant of product.variants) {
        if (product.variants.length > 1)
          await page
            .getByRole("button", { name: variant.size, exact: true })
            .click();
        await expect(page.locator(".product-detail-copy .text-2xl")).toHaveText(
          `$${(variant.priceCents / 100).toFixed(2)}`,
        );
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .click();
        await expect(page.locator("[data-sonner-toast]").last()).toContainText(
          product.name,
        );
      }
      await page.screenshot({
        path: `${folder}/${width}-${product.slug}.png`,
        fullPage: true,
        style: "[data-sonner-toaster] { visibility: hidden; }",
      });
    }
    await visit("/cart");
    await expect(page.locator(".cart-item")).toHaveCount(6);
    await expect(page.locator(".summary-totals dd").first()).toHaveText(
      "$76.00",
    );
    await page.reload();
    await expect(page.locator(".summary-totals dd").first()).toHaveText(
      "$76.00",
    );
    const review = await page.request.post(origin + "/api/cart/review", {
      data: {
        items: products.flatMap((product) =>
          product.variants.map((variant) => ({
            variantId: `${product.slug}:${variant.size}:Standard`,
            quantity: 1,
          })),
        ),
      },
    });
    assert.equal(review.status(), 200, await review.text());
    assert.equal((await review.json()).subtotalCents, 7600);
    assert.deepEqual(errors, []);
    console.log(
      `${width}px: logo navigation, complete story, four product photos, six variant prices, cart persistence and server review passed.`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
