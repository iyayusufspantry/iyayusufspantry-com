import { expect, test } from "@playwright/test";
import { quoteCart, variants } from "../lib/commerce/catalog";
import {
  adjustStock,
  availableStock,
  cancelOrder,
  fulfillOrder,
  recordPayment,
  reserveOrder,
  type CommerceState,
} from "../lib/commerce/orders";
import { sampleStock } from "../lib/commerce/sample";

const variantId = "classic-chin-chin:Large:Vegan";
const items = [{ variantId, quantity: 2 }];
const initial = (): CommerceState => ({ stock: sampleStock(), orders: [] });

test("skip link becomes visible on keyboard focus and moves focus to main content", async ({
  page,
}) => {
  await page.goto("/prototype/owner");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveCSS("clip-path", "none");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(skip).toHaveCSS("clip-path", "inset(50%)");
});

test("catalogue variants have unique IDs, explicit cents, and at most six choices per product", () => {
  expect(new Set(variants.map((variant) => variant.id)).size).toBe(
    variants.length,
  );
  for (const variant of variants) {
    expect(Number.isSafeInteger(variant.priceCents)).toBe(true);
    expect(variant.priceCents).toBeGreaterThanOrEqual(0);
    expect(
      variants.filter((entry) => entry.productSlug === variant.productSlug)
        .length,
    ).toBeLessThanOrEqual(6);
  }
});

test("quotes aggregate duplicate variants before stock checks and never accept browser prices", () => {
  const available = availableStock(initial());
  expect(quoteCart(items, variants, available).subtotalCents).toBe(3200);
  expect(
    quoteCart([...items, ...items], variants, available).lines[0].quantity,
  ).toBe(4);
  expect(() =>
    quoteCart(
      [
        { variantId, quantity: 4 },
        { variantId, quantity: 4 },
      ],
      variants,
      available,
    ),
  ).toThrow("Not enough sample stock");
  expect(() =>
    quoteCart([{ ...items[0], priceCents: 1 }], variants, available),
  ).toThrow("Each item needs");
  for (const quantity of [0, -1, 1.5, 100, NaN, Infinity, "2"])
    expect(() =>
      quoteCart([{ variantId, quantity }], variants, available),
    ).toThrow();
  expect(() =>
    quoteCart([{ variantId: "missing", quantity: 1 }], variants, available),
  ).toThrow("no longer available");
  expect(() =>
    quoteCart(
      [{ variantId: "dried-hibiscus:Standard:Vegan", quantity: 1 }],
      variants,
      available,
    ),
  ).toThrow("Not enough sample stock");
});

test("all-or-nothing reservations prevent sequential overselling without mutating the previous state", () => {
  const before = initial();
  const reserved = reserveOrder(
    before,
    "one",
    [{ variantId, quantity: 5 }],
    variants,
  );
  expect(before.stock[variantId].reserved).toBe(0);
  expect(availableStock(reserved)[variantId]).toBe(1);
  expect(() => reserveOrder(reserved, "two", items, variants)).toThrow(
    "Not enough sample stock",
  );
  expect(reserved.orders).toHaveLength(1);
  expect(() =>
    reserveOrder(reserved, "one", [{ variantId, quantity: 1 }], variants),
  ).toThrow("unique order");
  expect(() =>
    reserveOrder(
      before,
      "mixed",
      [...items, { variantId: "missing", quantity: 1 }],
      variants,
    ),
  ).toThrow();
  expect(before.stock[variantId].reserved).toBe(0);
});

test("payment retries consume stock once; fulfillment requires payment", () => {
  const reserved = reserveOrder(initial(), "one", items, variants);
  expect(() => fulfillOrder(reserved, "one")).toThrow("Only paid orders");
  expect(() =>
    recordPayment(reserved, "one", {
      id: "payment-one",
      amountCents: 1,
      currency: "USD",
    }),
  ).toThrow("does not match");
  expect(() =>
    recordPayment(reserved, "one", {
      id: "payment-one",
      amountCents: 3200,
      currency: "EUR",
    }),
  ).toThrow("does not match");
  const payment = { id: "payment-one", amountCents: 3200, currency: "USD" };
  const paid = recordPayment(reserved, "one", payment);
  expect(paid.stock[variantId]).toEqual({ onHand: 4, reserved: 0 });
  expect(recordPayment(paid, "one", payment)).toEqual(paid);
  const fulfilled = fulfillOrder(paid, "one");
  expect(fulfilled.orders[0].status).toBe("fulfilled");
  expect(fulfillOrder(fulfilled, "one")).toEqual(fulfilled);
  expect(recordPayment(fulfilled, "one", payment)).toEqual(fulfilled);
  expect(() => cancelOrder(paid, "one")).toThrow("Only unpaid reservations");
  const second = reserveOrder(paid, "two", items, variants);
  expect(() => recordPayment(second, "two", payment)).toThrow("already linked");
});

test("cancellation releases reservations once; late payments and stock below reservations are rejected", () => {
  const reserved = reserveOrder(initial(), "one", items, variants);
  expect(() => adjustStock(reserved, variantId, 1)).toThrow(
    "at least the reserved amount",
  );
  expect(() => adjustStock(reserved, variantId, 2.5)).toThrow();
  const cancelled = cancelOrder(reserved, "one");
  expect(cancelled.stock[variantId]).toEqual({ onHand: 6, reserved: 0 });
  expect(cancelOrder(cancelled, "one")).toEqual(cancelled);
  expect(() =>
    recordPayment(cancelled, "one", {
      id: "late",
      amountCents: 3200,
      currency: "USD",
    }),
  ).toThrow("cannot accept");
});

test("review API uses server catalogue and explicitly leaves payment and total disabled", async ({
  request,
}) => {
  const response = await request.post("/api/cart/review", { data: { items } });
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toMatchObject({
    subtotalCents: 3200,
    currency: "USD",
    mode: "sample",
    paymentEnabled: false,
    shippingCents: null,
    taxCents: null,
    totalCents: null,
  });
  for (const body of [
    { items: [] },
    { items, subtotalCents: 1 },
    { items: [{ ...items[0], priceCents: 1 }] },
    { items, email: "sample@example.com" },
  ])
    expect(
      (await request.post("/api/cart/review", { data: body })).status(),
    ).toBe(400);
  expect(
    (
      await request.post("/api/cart/review", {
        data: { items: [{ variantId, quantity: 7 }] },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/cart/review", {
        data: "bad",
        headers: { "Content-Type": "application/json" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/cart/review", {
        data: "x".repeat(17000),
        headers: { "Content-Type": "application/json" },
      })
    ).status(),
  ).toBe(413);
  expect(
    (await request.post("/api/cart/review", { data: "text" })).status(),
  ).toBe(415);
});

test("checkout review screenshot, selection-only requests, and retryable server errors", async ({
  page,
}, testInfo) => {
  await page.goto("/checkout");
  await page
    .getByRole("button", { name: "Load sample cart", exact: true })
    .click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("sample@example.com");
  const requestPromise = page.waitForRequest((request) =>
    request.url().endsWith("/api/cart/review"),
  );
  await page.getByRole("button", { name: "Check sample availability" }).click();
  const request = await requestPromise;
  expect(request.postData()).not.toContain("sample@example.com");
  await expect(page.locator('[data-review-status="success"]')).toContainText(
    "$26.50",
  );
  await page
    .locator("[data-sonner-toast]")
    .first()
    .waitFor({ state: "hidden" });
  await page.screenshot({
    path: `artifacts/screenshots/${testInfo.project.name}/checkout-reviewed.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.locator(".order-summary").screenshot({
    path: `artifacts/screenshots/${testInfo.project.name}/checkout-review-detail.png`,
    animations: "disabled",
  });
  await page.route("**/api/cart/review", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Cart review is temporarily unavailable. Please try again.",
      }),
    }),
  );
  await page.getByRole("button", { name: "Check sample availability" }).click();
  await expect(page.locator('[data-review-status="error"]')).toContainText(
    "Please try again",
  );
  await expect(
    page.getByRole("button", { name: "Check sample availability" }),
  ).toBeEnabled();
});

test("owner preview screenshots, fulfillment, reservation release, stock edits, empty results and reset", async ({
  page,
}, testInfo) => {
  await page.goto("/prototype/owner");
  await page.screenshot({
    path: `artifacts/screenshots/${testInfo.project.name}/owner-overview.png`,
    animations: "disabled",
  });
  const paid = page.getByRole("article", { name: "SIM-DEMO-001", exact: true });
  await paid.getByRole("button", { name: "Mark fulfilled" }).click();
  await expect(paid).toContainText("Fulfilled");
  const pending = page.getByRole("article", {
    name: "SIM-DEMO-002",
    exact: true,
  });
  await pending.getByRole("button", { name: "Cancel reservation" }).click();
  await expect(pending).toContainText("Cancelled");
  await page.getByLabel("Search stock").fill("Classic Chin Chin");
  const row = page.getByRole("article", {
    name: "Classic Chin Chin Small Vegetarian",
    exact: true,
  });
  await expect(row).toContainText("0 reserved");
  await row.getByLabel("On hand").fill("0");
  await row.getByRole("button", { name: "Save stock" }).click();
  await expect(row).toContainText("Out of stock");
  await page.getByLabel("Availability", { exact: true }).selectOption("out");
  await expect(page.locator(".owner-stock-row")).toHaveCount(1);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `artifacts/screenshots/${testInfo.project.name}/owner-updated.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.getByLabel("Search stock").fill("not-found");
  await expect(
    page.getByText("No matching variants.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset sample workspace" }).click();
  await expect(paid).toContainText("Ready to pack");
  await expect(pending).toContainText("Awaiting payment");
  await expect(row).toContainText("1 reserved");
});

test("restored carts ignore malformed entries, merge duplicates, and discard unexpected fields", async ({
  page,
}) => {
  await page.goto("/cart");
  await page.evaluate(() => {
    const item = {
      key: "plantain-chips:Small:Vegan",
      slug: "plantain-chips",
      size: "Small",
      dietary: "Vegan",
      quantity: 1,
      unwanted: "discard-me",
    };
    sessionStorage.setItem(
      "simbiat-scope-cart-v1",
      JSON.stringify([
        null,
        item,
        item,
        { ...item, quantity: 0 },
        { ...item, size: "Unknown" },
      ]),
    );
  });
  await page.reload();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await expect(page.locator(".summary-total")).toContainText("$13.00");
  await page
    .getByRole("button", { name: "Increase plantain chips quantity" })
    .click();
  expect(
    await page.evaluate(() => sessionStorage.getItem("simbiat-scope-cart-v1")),
  ).not.toContain("discard-me");
});
