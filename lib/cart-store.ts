// Browser-only mock selections. Never persist customer, address, or payment data.
import { products, type Product } from "@/data/products";
export type CartItem = {
  key: string;
  slug: string;
  size: string;
  dietary: string;
  quantity: number;
};
const storageKey = "simbiat-scope-cart-v1";
const emptySnapshot: CartItem[] = [];
let snapshot = emptySnapshot;
let initialized = false;
const listeners = new Set<() => void>();
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function serverSnapshot() {
  return emptySnapshot;
}
export function getSnapshot() {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    try {
      const stored: unknown = JSON.parse(
        sessionStorage.getItem(storageKey) ?? "[]",
      );
      if (Array.isArray(stored))
        snapshot = stored.filter((item): item is CartItem => {
          if (!item || typeof item !== "object") return false;
          const product = products.find((p) => p.slug === item.slug);
          return (
            !!product &&
            (product.sizes ?? ["Standard"]).includes(item.size) &&
            (product.dietary ?? ["Standard"]).includes(item.dietary) &&
            item.key === [item.slug, item.size, item.dietary].join(":") &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= 99
          );
        });
    } catch {
      /* Disabled or invalid storage leaves an empty, usable sample cart. */
    }
  }
  return snapshot;
}
function commit(next: CartItem[]) {
  snapshot = next;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    /* In-memory selections still work. */
  }
  listeners.forEach((listener) => listener());
}
export function addItem(
  product: Product,
  quantity: number,
  size: string,
  dietary: string,
) {
  const current = getSnapshot();
  const key = [product.slug, size, dietary].join(":");
  const existing = current.find((item) => item.key === key);
  commit(
    existing
      ? current.map((item) =>
          item.key === key
            ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
            : item,
        )
      : [
          ...current,
          {
            key,
            slug: product.slug,
            size,
            dietary,
            quantity: Math.max(1, Math.min(99, quantity)),
          },
        ],
  );
}
export function updateItem(key: string, quantity: number) {
  commit(
    getSnapshot().map((item) =>
      item.key === key
        ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) }
        : item,
    ),
  );
}
export function removeItem(key: string) {
  commit(getSnapshot().filter((item) => item.key !== key));
}
export function loadDemoItems() {
  commit(
    products.slice(0, 3).map((p) => {
      const size = p.sizes?.[0] ?? "Standard";
      const dietary = p.dietary?.[0] ?? "Standard";
      return {
        key: [p.slug, size, dietary].join(":"),
        slug: p.slug,
        size,
        dietary,
        quantity: 1,
      };
    }),
  );
}
