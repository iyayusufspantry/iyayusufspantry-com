// Verify either the local staged preview or the published storefront; never place orders.
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import {
  photos,
  products,
  sharedSnackReferenceSlugs,
} from "./september-30-content.mjs";

const origin = process.argv[2] || "http://localhost:3103";
const folder = `artifacts/client-feedback-2026-09-30/${new URL(origin).hostname === "localhost" ? "preview" : "live"}`;
await mkdir(folder, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    async function visit(route) {
      const response = await page.goto(origin + route, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      assert.equal(response.status(), 200, route);
      await page.locator("h1").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    async function screenshot(name) {
      await page.locator("main img").evaluateAll(async (images) => {
        for (const image of images) {
          image.loading = "eager";
          await image.decode();
        }
      });
      await page.screenshot({
        path: `${folder}/${width}-${name}.png`,
        fullPage: true,
      });
    }
    await visit("/");
    await expect(page.locator(".hero-visual img")).toHaveAttribute(
      "alt",
      photos.assortment[1],
    );
    for (const role of ["snackJars", "coconut", "drinks"])
      await expect(
        page.locator(".pantry-photo-grid").getByAltText(photos[role][1]),
      ).toBeVisible();
    await expect(page.locator(".story-section img")).toHaveAttribute(
      "alt",
      photos.snackJars[1],
    );
    await screenshot("home");
    for (const product of products) {
      await visit(`/shop/${product.slug}`);
      await expect(page.locator("h1")).toHaveText(product.name);
      await expect(page.locator(".product-detail-copy")).toContainText(
        product.description,
      );
      await expect(page.locator(".product-detail-copy")).not.toContainText(
        "Sample price",
      );
      const thumbnails = page.locator(".gallery-thumbnails button");
      await expect(thumbnails).toHaveCount(product.photos.length);
      for (const [index, role] of product.photos.entries()) {
        await thumbnails.nth(index).click();
        const image = page.locator(".product-main-image img");
        await expect(image).toHaveAttribute("alt", photos[role][1]);
        await image.evaluate((element) => element.decode());
        assert.equal(
          await image.evaluate(
            (element) => getComputedStyle(element).objectFit,
          ),
          "contain",
        );
      }
      await screenshot(`${product.slug}-reference`);
      await thumbnails.first().click();
      for (const variant of product.variants) {
        if (product.variants.length > 1)
          await page
            .getByRole("button", { name: variant.size, exact: true })
            .click();
        else
          await expect(
            page.locator(".product-detail-copy .variant-field"),
          ).toHaveCount(0);
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
      await screenshot(product.slug);
      results.push({
        width,
        slug: product.slug,
        variants: product.variants,
        gallery: product.photos.length,
      });
    }
    for (const slug of sharedSnackReferenceSlugs) {
      await visit(`/shop/${slug}`);
      await page.locator(".gallery-thumbnails button").last().click();
      await expect(page.locator(".product-main-image img")).toHaveAttribute(
        "alt",
        photos.snackReference[1],
      );
      await page
        .locator(".product-main-image img")
        .evaluate((element) => element.decode());
    }
    await visit("/cart");
    await expect(page.locator(".cart-item")).toHaveCount(3);
    await expect(page.locator(".summary-totals dd").first()).toHaveText(
      "$40.00",
    );
    await page.reload();
    await expect(page.locator(".summary-totals dd").first()).toHaveText(
      "$40.00",
    );
    await screenshot("cart");
    await visit("/shop?category=snacks");
    await page
      .getByRole("searchbox", { name: "Search products", exact: true })
      .fill("Chin Chin");
    await expect(page.locator(".product-card")).toHaveCount(1);
    await expect(page.locator(".product-card")).toContainText("$10.00");
    assert.deepEqual(errors, []);
    results.push({
      width,
      sharedSnackReferences: 4,
      cartSubtotal: 40,
      persisted: true,
      browserErrors: errors,
    });
    await page.close();
  }
  await writeFile(
    `${folder}/verification.json`,
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
