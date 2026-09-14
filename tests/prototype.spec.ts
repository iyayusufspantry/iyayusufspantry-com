import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { prototypeScreens } from "../data/scope";
import { products } from "../data/products";
import { recipes } from "../data/recipes";
import { posts } from "../data/posts";

for (const screen of [
  ...prototypeScreens,
  { name: "Screen directory", href: "/prototype" },
]) {
  test(`${screen.name}: layout, accessibility, and screenshot`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const response = await page.goto(screen.href);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByText("Project Scope Prototype", { exact: true }),
    ).toBeVisible();
    if (screen.href === "/cart" || screen.href === "/checkout") {
      await page
        .getByRole("button", { name: "Load sample cart", exact: true })
        .click();
      await expect(
        page
          .locator(".cart-item h3, .summary-item strong")
          .filter({ hasText: "Plantain Chips" })
          .first(),
      ).toBeVisible();
      await page
        .locator("[data-sonner-toast]")
        .first()
        .waitFor({ state: "hidden", timeout: 10000 });
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(
      overflow,
      "Page should fit the viewport without horizontal scrolling",
    ).toBe(false);
    await page.screenshot({
      path: `artifacts/screenshots/${testInfo.project.name}/${screen.href === "/" ? "home" : screen.href.slice(1).replaceAll("/", "-")}.png`,
      fullPage: true,
      animations: "disabled",
    });
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      accessibility.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("all sample detail pages and missing slugs resolve correctly", async ({
  request,
}) => {
  for (const route of [
    ...products.map((p) => `/shop/${p.slug}`),
    ...recipes.map((r) => `/recipes/${r.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
  ])
    expect((await request.get(route)).status()).toBe(200);
  for (const route of [
    "/shop/not-a-product",
    "/recipes/not-a-recipe",
    "/blog/not-an-article",
  ])
    expect((await request.get(route)).status()).toBe(404);
});

test("variant selections, cart math, refresh persistence, checkout notice, and removal", async ({
  page,
}) => {
  await page.goto("/shop/classic-chin-chin");
  await page.getByRole("button", { name: "Large", exact: true }).click();
  await page.getByRole("button", { name: "Vegan", exact: true }).click();
  await page
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.getByRole("link", { name: "Shopping bag, 2 items" }).click();
  await expect(page.locator(".cart-item")).toContainText("Large · Vegan");
  await expect(page.locator(".summary-total")).toContainText("$32.00");
  await page.reload();
  await expect(page.locator(".summary-total")).toContainText("$32.00");
  await page
    .getByRole("button", { name: "Increase classic chin chin quantity" })
    .click();
  await expect(page.locator(".summary-total")).toContainText("$48.00");
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(
    page.getByRole("heading", { name: "Secure payment provider integration" }),
  ).toBeVisible();
  await expect(
    page.locator('input[name*="card"], input[autocomplete="cc-number"]'),
  ).toHaveCount(0);
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") submissions.push(request.url());
  });
  await page
    .getByLabel("Email address", { exact: true })
    .fill("sample@example.com");
  await page.getByRole("button", { name: "Place order — prototype" }).click();
  await expect(
    page.getByText("Prototype only — no payment was processed.").first(),
  ).toBeVisible();
  expect(submissions).toEqual([]);
  const stored = await page.evaluate(() =>
    JSON.stringify({
      session: { ...sessionStorage },
      local: { ...localStorage },
    }),
  );
  expect(stored).not.toContain("sample@example.com");
  await page
    .getByRole("link", { name: "Preview the order confirmation screen" })
    .click();
  await expect(page.locator(".confirmation-card")).toContainText("$48.00");
  await page.goto("/cart");
  await page.getByRole("button", { name: "Remove Classic Chin Chin" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Your bag is waiting for something good",
    }),
  ).toBeVisible();
});

test("category, search, sorting, empty states, and cross-content search", async ({
  page,
}) => {
  await page.goto("/shop?category=snacks");
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(15);
  await page.getByLabel("Sort products").selectOption("price-low");
  await expect(page.locator(".product-card").first()).toContainText(
    "Ground Dry Pepper",
  );
  await page
    .getByRole("searchbox", { name: "Search products", exact: true })
    .fill("nothing-matches-this");
  await expect(
    page.getByRole("heading", { name: "No pantry finds just yet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".product-card")).toHaveCount(15);
  await page.goto("/search");
  await page.getByRole("searchbox").fill("egusi");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "In the kitchen", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "From the journal", exact: true }),
  ).toBeVisible();
  await page.goto("/recipes");
  await page.getByRole("button", { name: "Drinks", exact: true }).click();
  await expect(page.locator(".editorial-card")).toHaveCount(1);
  await page.goto("/blog");
  await page.getByRole("searchbox").fill("new chapter");
  await expect(page.locator(".editorial-card")).toHaveCount(1);
});

test("scope questions modal keyboard behavior and review checklist", async ({
  page,
}) => {
  await page.goto("/scope");
  const trigger = page.getByRole("button", { name: "Scope questions" }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("li")).toHaveCount(15);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole("checkbox", { name: "Logo", exact: true }).check();
  await expect(
    page.getByRole("checkbox", { name: "Logo", exact: true }),
  ).toBeChecked();
});

test("contact and newsletter are frontend-only demonstrations", async ({
  page,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") submissions.push(request.url());
  });
  await page.goto("/contact");
  await page.getByLabel("Name", { exact: true }).fill("Sample Customer");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("sample@example.com");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Sample inquiry for the prototype.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText(
      "Prototype only — contact form integration will be implemented during development.",
    ),
  ).toBeVisible();
  await page.goto("/");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("sample@example.com");
  await page.getByRole("button", { name: "Subscribe to newsletter" }).click();
  await expect(
    page.getByText("Prototype only — newsletter integration is not connected."),
  ).toBeVisible();
  expect(submissions).toEqual([]);
});

test("mobile menu and buy now complete their navigation", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Shop", exact: true })
      .click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  }
  await page.goto("/shop/plantain-chips");
  await page
    .getByRole("button", { name: "Buy now — preview checkout" })
    .click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.locator(".summary-item")).toContainText("Plantain Chips");
});
