"use client";
import { useContent } from "@/components/content-provider";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { toast, Toaster } from "sonner";
import {
  createCartStore,
  type CartState,
  type CartStore,
} from "@/lib/cart-store";

// Context holds one stable store instance, not a changing cart snapshot.
const CartContext = createContext<CartStore | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const content = useContent();
  const [store] = useState(() => createCartStore(content));
  useEffect(() => {
    // Hydrate before any persisted write, otherwise refresh could erase the saved cart.
    void Promise.resolve(
      store.persist.hasHydrated() ? undefined : store.persist.rehydrate(),
    ).then(() => {
      store.getState().replaceCatalogue(content);
      store.setState({ ready: true });
    });
  }, [store, content]);
  return (
    <CartContext.Provider value={store}>
      {children}
      <Toaster position="bottom-right" richColors={false} closeButton />
    </CartContext.Provider>
  );
}

export function useCart<T>(selector: (state: CartState) => T): T {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/cart-provider.tsx"];

  const store = useContext(CartContext);
  if (!store) throw new Error(copy["copy-1"]);
  return useStore(store, selector);
}

export function useAddToCart() {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/cart-provider.tsx"];

  const add = useCart((state) => state.add);
  return useCallback(
    (...args: Parameters<CartState["add"]>) => {
      if (add(...args)) toast.success(args[0].name + " " + copy["copy-2"]);
    },
    [add, copy],
  );
}

export function useLoadDemoCart() {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/cart-provider.tsx"];

  const loadDemo = useCart((state) => state.loadDemo);
  return useCallback(() => {
    loadDemo();
    toast(copy["copy-3"]);
  }, [loadDemo, copy]);
}
