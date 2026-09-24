import { expect, test } from "@playwright/test";

test("sandbox checkout sends only selections and reuses requests after a network failure", async ({
  page,
}) => {
  const requests: { requestId: string; items: unknown[] }[] = [];
  await page.route("**/api/checkout/session", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 503,
      json: {
        error: "Checkout is temporarily unavailable. Retry with the same bag.",
      },
    });
  });
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Try a test checkout" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load sample cart" }).click();
  const pay = page.getByRole("button", {
    name: "Continue to Stripe — test payment",
  });
  await pay.click();
  await expect(page.locator("p[role=alert]")).toContainText(
    "Retry with the same bag",
  );
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
});

test("confirmation waits for the webhook and displays confirmed database status", async ({
  page,
}) => {
  let paid = false;
  await page.route("**/api/checkout/status?*", (route) =>
    route.fulfill({
      json: {
        status: paid ? "paid" : "pending",
        reference: "test-reference",
        totalCents: 1450,
      },
    }),
  );
  await page.goto("/order-confirmation?session_id=cs_test_example12345");
  await expect(
    page.getByRole("heading", { name: "Confirming your test payment" }),
  ).toBeVisible();
  paid = true;
  await expect(
    page.getByRole("heading", { name: "Test payment confirmed" }),
  ).toBeVisible();
  await expect(page.locator(".confirmation-card")).toContainText("$14.50");
});

test("webhook route rejects unsigned input and checkout rejects foreign origins", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/stripe/webhook", {
        data: { type: "checkout.session.completed" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/checkout/session", {
        headers: { Origin: "https://unrelated.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.get("/api/checkout/status?session_id=invalid")).status(),
  ).toBe(400);
});
