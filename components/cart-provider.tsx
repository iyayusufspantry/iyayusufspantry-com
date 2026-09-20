"use client";
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
  const [store] = useState(() => createCartStore());
  useEffect(() => {
    if (store.persist.hasHydrated()) return;
    void Promise.resolve(store.persist.rehydrate()).then(() => {
      store.setState({ ready: true });
    });
  }, [store]);
  return (
    <CartContext.Provider value={store}>
      {children}
      <Toaster position="bottom-right" richColors={false} closeButton />
    </CartContext.Provider>
  );
}

export function useCart<T>(selector: (state: CartState) => T): T {
  const store = useContext(CartContext);
  if (!store) throw new Error("CartProvider is required");
  return useStore(store, selector);
}

export function useAddToCart() {
  const add = useCart((state) => state.add);
  return useCallback(
    (...args: Parameters<CartState["add"]>) => {
      if (add(...args))
        toast.success(args[0].name + " added to your sample cart");
    },
    [add],
  );
}

export function useLoadDemoCart() {
  const loadDemo = useCart((state) => state.loadDemo);
  return useCallback(() => {
    loadDemo();
    toast("Sample cart loaded");
  }, [loadDemo]);
}
