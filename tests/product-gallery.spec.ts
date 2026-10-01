import { test, expect } from "@playwright/test";

test("product photos rotate, pause for inspection, and retain manual selection", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/shop/zobo-drink");
  const gallery = page.getByRole("region", { name: "Zobo Drink photos" });
  const thumbnails = gallery.locator(".gallery-thumbnails button");
  await expect(
    gallery.getByRole("button", { name: "Pause slideshow" }),
  ).toBeVisible();
  await expect(thumbnails.nth(0)).toHaveAttribute("aria-pressed", "true");
  await page.clock.runFor(5100);
  await expect(thumbnails.nth(1)).toHaveAttribute("aria-pressed", "true");

  await gallery.hover();
  await page.clock.runFor(10000);
  await expect(thumbnails.nth(1)).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(0, 0);
  await page.clock.runFor(5100);
  await expect(thumbnails.nth(2)).toHaveAttribute("aria-pressed", "true");
  await page.clock.runFor(5100);
  await expect(thumbnails.nth(0)).toHaveAttribute("aria-pressed", "true");

  await gallery.getByRole("button", { name: "Previous photo" }).click();
  await expect(thumbnails.nth(2)).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(0, 0);
  await page.clock.runFor(10000);
  await expect(thumbnails.nth(2)).toHaveAttribute("aria-pressed", "true");
  await gallery.getByRole("button", { name: "Play slideshow" }).click();
  await page.mouse.move(0, 0);
  await page.clock.runFor(5100);
  await expect(thumbnails.nth(0)).toHaveAttribute("aria-pressed", "true");

  await thumbnails.nth(1).focus();
  await page.clock.runFor(10000);
  await expect(thumbnails.nth(0)).toHaveAttribute("aria-pressed", "true");
  await thumbnails.nth(1).press("Enter");
  await expect(thumbnails.nth(1)).toHaveAttribute("aria-pressed", "true");
});

test("reduced motion starts paused for drink and palm oil galleries", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/shop/zobo-drink");
  await expect(
    page.getByRole("button", { name: "Play slideshow" }),
  ).toBeVisible();
  await page.clock.runFor(15000);
  await expect(
    page.locator(".gallery-thumbnails button").first(),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/shop/palm-oil");
  await expect(page.locator(".product-main-image img")).toBeVisible();
  await expect(page.locator(".gallery-thumbnails button")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Play slideshow" }),
  ).toBeVisible();
  await page.clock.runFor(15000);
  await expect(
    page.locator(".gallery-thumbnails button").first(),
  ).toHaveAttribute("aria-pressed", "true");
});

test("full photos and thumbnails fit the viewport beneath the sticky header", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/shop/zobo-drink");
  const gallery = page.locator(".product-gallery");
  const photos = gallery.locator("img");
  await photos.evaluateAll(async (images) => {
    await Promise.all(
      images.map((image) => (image as HTMLImageElement).decode()),
    );
  });
  expect(
    await photos.evaluateAll((images) =>
      images.every((image) => getComputedStyle(image).objectFit === "contain"),
    ),
  ).toBe(true);
  const bounds = await gallery.boundingBox();
  const header = await page.locator(".site-header").boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/product-gallery/${testInfo.project.name}.png`,
  });
});
