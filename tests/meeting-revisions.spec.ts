import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("community and merch highlights show the supplied covers and keep their destinations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const banner = page.getByRole("region", { name: "Pantry highlights" });
  await banner.getByRole("button", { name: "Next highlight" }).click();
  await banner.getByRole("button", { name: "Next highlight" }).click();
  const photo = banner.locator(".highlight-visual img");
  for (const cover of [
    {
      asset: "pantry-asset-6f8eccc28752189555e32bec",
      href: "/stories",
      name: "community",
    },
    {
      asset: "pantry-asset-9b769a9478a90700e6611a03",
      href: "/shop?category=merch",
      name: "merch",
    },
  ]) {
    await expect(banner.getByRole("link")).toHaveAttribute("href", cover.href);
    await expect(photo).toHaveAttribute("src", new RegExp(cover.asset));
    await expect
      .poll(() =>
        photo.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await banner.screenshot({
      path: `artifacts/client-feedback-2026-10-24/${cover.name}-${test.info().project.name}.png`,
    });
    await banner.getByRole("button", { name: "Next highlight" }).click();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("ingredient searches preserve the supplied ingredients and allergen text", async ({
  page,
}) => {
  await page.goto("/shop/tiger-nut-drink");
  const ingredients = page.locator(".product-info-grid section").first();
  await expect(ingredients.locator("p").nth(1)).toHaveText(
    "Ingredients: tiger nuts, water, ginger, cloves, cinnamon, and honey.",
  );
  const tigerNuts = ingredients.getByRole("link", {
    name: "Search Google for tiger nuts (opens in a new tab)",
    exact: true,
  });
  await expect(tigerNuts).toHaveAttribute(
    "href",
    "https://www.google.com/search?q=tiger%20nuts%20ingredient",
  );
  await expect(tigerNuts).toHaveAttribute("target", "_blank");
  await expect(tigerNuts).toHaveAttribute("rel", "noopener noreferrer");
  await expect(
    ingredients.getByRole("link", { name: /Search Google for water/ }),
  ).toHaveCount(0);
  await expect(
    ingredients.getByRole("link", { name: /Search Google for cloves/ }),
  ).toBeVisible();
  await page.goto("/shop/classic-chin-chin");
  await expect(
    page
      .locator(".product-info-grid")
      .getByText("Contains milk.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Search Google for nutmeg/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/meeting-2026-10-24/ingredients-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("community stories show previews, open the full story and support title search", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/stories");
  const card = page
    .locator(".community-story-card")
    .filter({ hasText: "Rediscovering the Taste of Home" });
  await expect(card).toBeVisible();
  await expect(card.locator(".community-story-excerpt")).toHaveCSS(
    "-webkit-line-clamp",
    "3",
  );
  await expect(card.locator(".article-body")).toHaveCount(0);
  const read = card.getByRole("button", {
    name: "Read story: Rediscovering the Taste of Home",
    exact: true,
  });
  await read.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Rediscovering the Taste of Home",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".article-body p").first()).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "Open story page" }),
  ).toHaveAttribute("href", "/blog/rediscovering-the-taste-of-home");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: `artifacts/meeting-2026-10-24/story-open-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(read).toBeFocused();
  const search = page.getByRole("searchbox", { name: "Find a story" });
  await search.fill("no matching story 87654");
  await expect(page.locator(".community-story-card")).toHaveCount(0);
  await expect(
    page.getByText("No stories match your search. Try another title or name."),
  ).toBeVisible();
  await search.fill("REDISCOVERING");
  await expect(page.locator(".community-story-card")).toHaveCount(1);
  await search.fill("");
  for (const width of [320, 390, 1440, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize(test.info().project.use.viewport!);
  expect(
    (
      await new AxeBuilder({ page })
        .include(".community-stories")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: `artifacts/meeting-2026-10-24/story-cards-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
