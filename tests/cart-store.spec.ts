import { test, expect } from "@playwright/test";
import {
  createCartStore,
  selectCartCount,
  selectCartSubtotal,
} from "../lib/cart-store";
import { products } from "../data/products";

test("cart stores are isolated and defer storage reads until hydration", async () => {
  let reads = 0;
  const storage = {
    getItem: () => {
      reads++;
      return null;
    },
    setItem: () => {},
    removeItem: () => {},
  };
  const first = createCartStore(() => storage);
  const second = createCartStore(() => storage);
  expect(reads).toBe(0);
  expect(first.getInitialState().items).toEqual([]);
  expect(first.getState().ready).toBe(false);
  await first.persist.rehydrate();
  expect(reads).toBe(1);
  const add = first.getState().add;
  expect(add(products[0], 2)).toBe(true);
  expect(selectCartCount(first.getState())).toBe(2);
  expect(selectCartSubtotal(first.getState())).toBe(13);
  expect(second.getState().items).toEqual([]);
  expect(first.getInitialState().items).toEqual([]);
  expect(first.getState().add).toBe(add);
});

test("Zustand restores the legacy cart and persists only valid selection fields", async () => {
  const item = {
    key: "plantain-chips:Small:Vegan",
    slug: "plantain-chips",
    size: "Small",
    dietary: "Vegan",
    quantity: 70,
  };
  let saved = JSON.stringify([
    item,
    { ...item, customer: "private", price: 1 },
    { ...item, quantity: 0 },
    { ...item, slug: "missing" },
  ]);
  const store = createCartStore(() => ({
    getItem: () => saved,
    setItem: (_key, value) => {
      saved = value;
    },
    removeItem: () => {
      saved = "[]";
    },
  }));
  await store.persist.rehydrate();
  expect(store.getState().items).toEqual([{ ...item, quantity: 99 }]);
  store.setState({ ready: true });
  expect(JSON.parse(saved)).toEqual([{ ...item, quantity: 99 }]);
  expect(store.getState().add(products[0], NaN)).toBe(false);
  expect(store.getState().add(products[0], 1, "invalid", "Vegan")).toBe(false);
  store.getState().update(item.key, 1.5);
  expect(selectCartCount(store.getState())).toBe(99);
  store.getState().update(item.key, 3);
  expect(selectCartSubtotal(store.getState())).toBe(19.5);
  store.getState().remove(item.key);
  expect(JSON.parse(saved)).toEqual([]);
});

for (const mode of ["invalid-json", "unavailable", "quota-exceeded"] as const) {
  test(`cart remains usable when session storage is ${mode}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((mode) => {
      if (mode === "invalid-json") {
        sessionStorage.setItem("simbiat-scope-cart-v1", "{invalid");
      } else if (mode === "unavailable") {
        Object.defineProperty(window, "sessionStorage", {
          get() {
            throw new DOMException("Storage disabled", "SecurityError");
          },
        });
      } else {
        Storage.prototype.setItem = () => {
          throw new DOMException("Storage full", "QuotaExceededError");
        };
      }
    }, mode);
    await page.goto("/cart");
    await expect(
      page.getByRole("heading", {
        name: "Your bag is waiting for something good",
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Load sample cart", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Shopping bag, 3 items" }),
    ).toBeVisible();
    await expect(page.locator(".cart-item")).toHaveCount(3);
    await page.getByRole("link", { name: "Continue to checkout" }).click();
    await expect(page.locator(".summary-total")).toContainText("$26.50");
    expect(errors).toEqual([]);
  });
}
