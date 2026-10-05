// Read-only browser checks, with selections in an isolated browser cart.
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { products, photos } from "./october-4-content.mjs";

const origin = process.argv[2] || "http://localhost:3107";
const remote = !/^(localhost|127\.0\.0\.1)$/.test(new URL(origin).hostname);
const folder = `artifacts/client-feedback-2026-10-04/browser-${remote ? "live" : "local"}`;
await mkdir(folder, { recursive: true });
const browser = await chromium.launch();
const checks = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    async function visit(path, status = 200) {
      const response = await page.goto(origin + path);
      assert.equal(response.status(), status, path);
      if (status === 200) await page.locator("h1").waitFor();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    for (const product of products) {
      await visit(`/shop/${product.slug}`);
      await expect(page.locator("h1")).toHaveText(product.name);
      const copy = page.locator(".product-detail-copy");
      await expect(copy).toContainText(product.description);
      await expect(copy.locator(".text-2xl")).toHaveText(
        `$${(product.variants[0].priceCents / 100).toFixed(2)}`,
      );
      await expect(copy).toContainText(product.unit);
      for (const text of [product.ingredients, product.allergens].filter(
        Boolean,
      ))
        await expect(page.locator(".product-info-grid")).toContainText(text);
      if (product.photos.length) {
        const main = page.locator(".product-main-image img");
        await expect(main).toHaveAttribute("alt", photos[product.photos[0]][1]);
        await main.evaluate((image) => image.decode());
        if (product.photos.length > 1) {
          await page
            .getByRole("button", { name: "Next photo", exact: true })
            .click();
          await expect(main).toHaveAttribute(
            "alt",
            photos[product.photos[1]][1],
          );
          await main.evaluate((image) => image.decode());
        }
      } else {
        await expect(page.locator(".product-main-image img")).toHaveCount(0);
        await expect(page.locator(".product-main-image")).toContainText(
          /photo coming soon/i,
        );
      }
      if (product.learnMoreUrl && !process.argv.includes("--content-only")) {
        const info = page.getByRole("link", {
          name: `Learn more about ${product.name}`,
          exact: false,
        });
        await expect(info).toHaveAttribute("href", product.learnMoreUrl);
        await expect(info).toHaveAttribute("target", "_blank");
        await expect(info).toHaveAttribute("rel", "noopener noreferrer");
      }
      await page
        .getByRole("button", { name: "Add to cart", exact: true })
        .click();
      await expect(page.locator("[data-sonner-toast]").last()).toContainText(
        product.name,
      );
      await page.screenshot({
        path: `${folder}/${width}-${product.slug}.png`,
        fullPage: true,
        style: "[data-sonner-toaster] { visibility: hidden; }",
      });
      checks.push({ width, product: product.slug, passed: true });
    }
    await visit("/cart");
    await expect(page.locator(".cart-item")).toHaveCount(8);
    await expect(page.locator(".summary-totals dd").first()).toHaveText(
      "$71.00",
    );
    await page.reload();
    await expect(page.locator(".summary-totals dd").first()).toHaveText(
      "$71.00",
    );
    const review = await page.request.post(origin + "/api/cart/review", {
      data: {
        items: products.map((product) => ({
          variantId: `${product.slug}:${product.variants[0].size}:Standard`,
          quantity: 1,
        })),
      },
    });
    assert.equal(review.status(), 200, await review.text());
    assert.equal((await review.json()).subtotalCents, 7100);
    const stale = await page.request.post(origin + "/api/cart/review", {
      data: {
        items: [{ variantId: "plantain-chips:Small:Vegan", quantity: 1 }],
      },
    });
    assert.equal(stale.status(), 409, await stale.text());
    await visit("/shop");
    await expect(
      page.getByRole("heading", { name: "Plantain Chips", exact: true }),
    ).toHaveCount(0);
    await visit("/shop/plantain-chips", 404);
    await visit("/recipes/plantain-snack-bowl", 404);
    await visit("/recipes");
    await expect(
      page.getByRole("heading", {
        name: "The everyday plantain snack bowl",
        exact: true,
      }),
    ).toHaveCount(0);
    await visit("/");
    const drink = page.locator(".editorial-card").filter({
      has: page.getByRole("heading", {
        name: "A refreshing hibiscus cooler",
        exact: true,
      }),
    });
    await expect(drink).toHaveCount(1);
    await expect(drink.locator("img")).toHaveAttribute("alt", photos.zobo[1]);
    await drink.scrollIntoViewIfNeeded();
    await drink.locator("img").evaluate((image) => {
      image.loading = "eager";
      return image.decode();
    });
    await drink.screenshot({ path: `${folder}/${width}-zobo-recipe.png` });
    await visit("/recipes/hibiscus-cooler");
    await expect(page.locator("main img").first()).toHaveAttribute(
      "alt",
      photos.zobo[1],
    );
    await visit("/shop/zobo-drink");
    const gallery = page.getByRole("region", { name: "Zobo Drink photos" });
    await gallery.locator(".gallery-thumbnails button").last().click();
    await expect(gallery.locator(".product-main-image img")).toHaveAttribute(
      "alt",
      photos.zobo[1],
    );
    await gallery
      .locator(".product-main-image img")
      .evaluate((image) => image.decode());
    await visit("/stories");
    await expect(
      page.getByRole("heading", {
        name: "Rediscovering the Taste of Home",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: `${folder}/${width}-stories.png`,
      fullPage: true,
    });
    await visit("/checkout");
    await writeFile(
      `${folder}/checkout-${width}.txt`,
      await page.locator("main").innerText(),
    );
    assert.deepEqual(errors, []);
    checks.push({
      width,
      cartSubtotalCents: 7100,
      removedPlantain: true,
      zoboPhoto: true,
      stories: true,
      passed: true,
    });
    console.log(
      `${width}px: eight products, photos/prices, $71 cart/server review, plantain removal, Zobo photo and stories passed.`,
    );
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${folder}/checks.json`, JSON.stringify(checks, null, 2));
}
