import { test, expect } from "@playwright/test";

test("live checkout hides test instructions, shows shipping and tax, and retains safe retries", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "simbiat-scope-cart-v1",
      JSON.stringify([
        {
          key: "classic-chin-chin:Standard:Standard",
          slug: "classic-chin-chin",
          size: "Standard",
          dietary: "Standard",
          quantity: 1,
        },
      ]),
    ),
  );
  const requests: { requestId: string; items: unknown[] }[] = [];
  await page.route("**/api/checkout/session", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 503,
      json: { error: "Please retry with the same bag." },
    });
  });
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Checkout", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".checkout-section")).not.toContainText("4242");
  await expect(
    page.getByRole("button", { name: "Load sample cart" }),
  ).toHaveCount(0);
  await expect(page.locator(".summary-totals")).toContainText("$6.99");
  await expect(page.locator(".summary-totals")).toContainText(
    "Calculated at checkout",
  );
  const pay = page.getByRole("button", { name: "Continue to secure payment" });
  await pay.click();
  await expect(page.locator("p[role=alert]")).toContainText("same bag");
  await page.reload();
  await pay.click();
  await expect(page.locator("p[role=alert]")).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0].requestId).toBe(requests[1].requestId);
  expect(Object.keys(requests[0]).sort()).toEqual(["items", "requestId"]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/live-payments-playwright/checkout-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("live confirmation displays verified full totals without sandbox wording", async ({
  page,
}) => {
  await page.route("**/api/checkout/status?*", (route) =>
    route.fulfill({
      json: {
        status: "paid",
        reference: "ui-only-reference",
        totalCents: 2478,
      },
    }),
  );
  await page.goto("/order-confirmation?session_id=cs_live_uiOnlyExample12345");
  await expect(
    page.getByRole("heading", { name: "Payment confirmed", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".confirmation-card")).toContainText("$24.78");
  await expect(page.locator(".confirmation-page")).not.toContainText(
    /sandbox|test payment|No real money/i,
  );
});
