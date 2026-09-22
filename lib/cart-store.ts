// Browser-only mock selections. Never persist customer, address, or payment data.
import { createStore } from "zustand/vanilla";
import { persist, type PersistStorage } from "zustand/middleware";
import type { Product } from "@/data/products";
import { type Variant, findVariant } from "@/lib/commerce/catalog";

export type CartItem = {
  key: string;
  slug: string;
  size: string;
  dietary: string;
  quantity: number;
};
export type CartState = {
  items: CartItem[];
  catalogue: { products: Product[]; variants: Variant[] };
  replaceCatalogue: (catalogue: {
    products: Product[];
    variants: Variant[];
  }) => void;
  ready: boolean;
  add: (
    product: Product,
    quantity?: number,
    size?: string,
    dietary?: string,
  ) => boolean;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  loadDemo: () => void;
};
type SavedCart = Pick<CartState, "items">;
type CartStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const storageKey = "simbiat-scope-cart-v1";

function restoreItems(
  value: unknown,
  variants: readonly Variant[],
): CartItem[] {
  if (!Array.isArray(value)) return [];
  const restored = new Map<string, CartItem>();
  for (const item of value.slice(0, 50)) {
    if (!item || typeof item !== "object") continue;
    if (
      typeof item.slug !== "string" ||
      typeof item.size !== "string" ||
      typeof item.dietary !== "string" ||
      item.key !== [item.slug, item.size, item.dietary].join(":") ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99 ||
      !findVariant(variants, item.slug, item.size, item.dietary)
    )
      continue;
    const previous = restored.get(item.key);
    restored.set(item.key, {
      key: item.key,
      slug: item.slug,
      size: item.size,
      dietary: item.dietary,
      quantity: Math.min(99, (previous?.quantity ?? 0) + item.quantity),
    });
  }
  return Array.from(restored.values());
}

// Preserve the existing raw-array format and defer all browser storage access.
function cartPersistence(
  getStorage: () => CartStorage,
  getVariants: () => readonly Variant[],
): PersistStorage<SavedCart> {
  return {
    getItem(name) {
      try {
        return {
          state: {
            items: restoreItems(
              JSON.parse(getStorage().getItem(name) ?? "[]"),
              getVariants(),
            ),
          },
          version: 0,
        };
      } catch {
        return null;
      }
    },
    setItem(name, value) {
      try {
        getStorage().setItem(
          name,
          JSON.stringify(restoreItems(value.state.items, getVariants())),
        );
      } catch {
        // The in-memory cart remains usable when storage is unavailable.
      }
    },
    removeItem(name) {
      try {
        getStorage().removeItem(name);
      } catch {
        // Storage may be disabled.
      }
    },
  };
}

export function createCartStore(
  catalogue: { products: Product[]; variants: Variant[] },
  getStorage: () => CartStorage = () => window.sessionStorage,
) {
  let currentCatalogue = catalogue;
  return createStore<CartState>()(
    persist(
      (set, get) => ({
        items: [],
        catalogue,
        replaceCatalogue(next) {
          currentCatalogue = next;
          set({
            catalogue: next,
            items: restoreItems(get().items, next.variants),
          });
        },
        ready: false,
        add(
          product,
          quantity = 1,
          size = product.sizes?.[0] ?? "Standard",
          dietary = product.dietary?.[0] ?? "Standard",
        ) {
          if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            !findVariant(get().catalogue.variants, product.slug, size, dietary)
          )
            return false;
          const key = [product.slug, size, dietary].join(":");
          const current = get().items;
          set({
            items: current.some((item) => item.key === key)
              ? current.map((item) =>
                  item.key === key
                    ? {
                        ...item,
                        quantity: Math.min(99, item.quantity + quantity),
                      }
                    : item,
                )
              : [
                  ...current,
                  {
                    key,
                    slug: product.slug,
                    size,
                    dietary,
                    quantity: Math.min(99, quantity),
                  },
                ],
          });
          return true;
        },
        update(key, quantity) {
          if (!Number.isInteger(quantity)) return;
          set({
            items: get().items.map((item) =>
              item.key === key
                ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) }
                : item,
            ),
          });
        },
        remove(key) {
          set({ items: get().items.filter((item) => item.key !== key) });
        },
        loadDemo() {
          set({
            items: get()
              .catalogue.products.filter((p) =>
                get().catalogue.variants.some(
                  (v) => v.productSlug === p.slug && v.active,
                ),
              )
              .slice(0, 3)
              .map((product) => {
                const size = product.sizes?.[0] ?? "Standard";
                const dietary = product.dietary?.[0] ?? "Standard";
                return {
                  key: [product.slug, size, dietary].join(":"),
                  slug: product.slug,
                  size,
                  dietary,
                  quantity: 1,
                };
              }),
          });
        },
      }),
      {
        name: storageKey,
        storage: cartPersistence(getStorage, () => currentCatalogue.variants),
        partialize: (state) => ({ items: state.items }),
        skipHydration: true,
        merge: (saved, current) => ({
          ...current,
          items: restoreItems(
            saved && typeof saved === "object" && "items" in saved
              ? saved.items
              : [],
            currentCatalogue.variants,
          ),
        }),
      },
    ),
  );
}

export type CartStore = ReturnType<typeof createCartStore>;
export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce(
    (sum, item) =>
      sum +
      (findVariant(state.catalogue.variants, item.slug, item.size, item.dietary)
        ?.priceCents ?? 0) *
        item.quantity,
    0,
  ) / 100;
