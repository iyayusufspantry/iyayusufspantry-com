"use client";
import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { toast, Toaster } from "sonner";
import { products, productPrice, type Product } from "@/data/products";
import {
  subscribe,
  serverSnapshot,
  getSnapshot,
  addItem,
  updateItem,
  removeItem,
  loadDemoItems,
  type CartItem,
} from "@/lib/cart-store";
type CartContextType = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (
    product: Product,
    quantity?: number,
    size?: string,
    dietary?: string,
  ) => void;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  loadDemo: () => void;
};
const CartContext = createContext<CartContextType | null>(null);
const browserReady = () => true;
const serverReady = () => false;
export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const ready = useSyncExternalStore(subscribe, browserReady, serverReady);
  function add(
    product: Product,
    quantity = 1,
    size = product.sizes?.[0] ?? "Standard",
    dietary = product.dietary?.[0] ?? "Standard",
  ) {
    addItem(product, quantity, size, dietary);
    toast.success(product.name + " added to your sample cart");
  }
  function loadDemo() {
    loadDemoItems();
    toast("Sample cart loaded");
  }
  return (
    <CartContext.Provider
      value={{
        items,
        ready,
        count: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: items.reduce(
          (sum, item) =>
            sum +
            productPrice(
              products.find((p) => p.slug === item.slug)!,
              item.size,
            ) *
              item.quantity,
          0,
        ),
        add,
        update: updateItem,
        remove: removeItem,
        loadDemo,
      }}
    >
      {children}
      <Toaster position="bottom-right" richColors={false} closeButton />
    </CartContext.Provider>
  );
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("CartProvider is required");
  return context;
}
