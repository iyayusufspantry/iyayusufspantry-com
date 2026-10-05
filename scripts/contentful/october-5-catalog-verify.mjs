// Read-only checks. Cart requests do not place orders or submit stories.
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.argv[2] || "http://localhost:3107";
const folder = `artifacts/client-feedback-2026-10-05-catalog/browser-${new URL(origin).hostname === "localhost" ? "local" : "live"}`;
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
    page.on("pageerror", (e) => errors.push(e.message));
    for (const product of [
      {
        slug: "white-garri",
        name: "Garri",
        unit: "1 lb",
        price: "$10.00",
        alt: "Garri piled in a blue bowl.",
      },
      {
        slug: "tiger-nuts",
        name: "Tiger Nuts",
        unit: "1 lb",
        price: "$10.00",
        alt: "Tiger nuts piled in a blue bowl.",
        second: "A handful of tiger nuts.",
      },
      {
        slug: "dried-hibiscus",
        name: "Dried Hibiscus Flower",
        unit: "1 oz",
        price: "$3.00",
        alt: "Dried hibiscus flowers piled in a blue bowl.",
        description:
          "Tart, vibrant red calyxes used worldwide for herbal teas, refreshing aguas frescas, and culinary recipes.",
      },
    ]) {
      const response = await page.goto(`${origin}/shop/${product.slug}`);
      assert.equal(response.status(), 200);
      await expect(page.locator("h1")).toHaveText(product.name);
      const copy = page.locator(".product-detail-copy");
      await expect(copy).toContainText(product.unit);
      await expect(copy.locator(".text-2xl")).toHaveText(product.price);
      if (product.description)
        await expect(copy).toContainText(product.description);
      const main = page.locator(".product-main-image img");
      await expect(main).toHaveAttribute("alt", product.alt);
      await main.evaluate((i) => i.decode());
      if (product.second) {
        await page
          .getByRole("button", { name: "Next photo", exact: true })
          .click();
        await expect(main).toHaveAttribute("alt", product.second);
        await main.evaluate((i) => i.decode());
      }
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: `${folder}/${width}-${product.slug}.png`,
        fullPage: true,
      });
      checks.push({ width, slug: product.slug, passed: true });
    }
    const review = await page.request.post(`${origin}/api/cart/review`, {
      data: {
        items: [{ variantId: "dried-hibiscus:1 oz:Standard", quantity: 2 }],
      },
    });
    // Existing sample inventory deliberately has zero hibiscus stock. Check
    // that the confirmed variant resolves, without inventing physical stock.
    assert.equal(review.status(), 409, await review.text());
    assert.equal((await review.json()).code, "INSUFFICIENT_STOCK");
    const old = await page.request.post(`${origin}/api/cart/review`, {
      data: {
        items: [{ variantId: "dried-hibiscus:100 g:Vegan", quantity: 1 }],
      },
    });
    assert.equal(old.status(), 409, await old.text());
    assert.equal((await old.json()).code, "UNAVAILABLE_VARIANT");
    assert.deepEqual(errors, []);
    checks.push({
      width,
      confirmedVariantRecognized: true,
      sampleInventoryUnavailable: true,
      inactiveSampleRejected: true,
    });
    await page.close();
  }
  await writeFile(
    `${folder}/verification.json`,
    JSON.stringify(checks, null, 2),
  );
  console.log(JSON.stringify(checks));
} finally {
  await browser.close();
}
