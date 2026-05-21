import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string; name: string; price: number;
  quantity: number; imageUrl?: string;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        const idx = items.findIndex(i => i.productId === item.productId);
        if (idx >= 0) {
          const updated = [...items];
          updated[idx].quantity += item.quantity;
          set({ items: updated });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeItem: (productId) => set({ items: get().items.filter(i => i.productId !== productId) }),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter(i => i.productId !== productId) });
        } else {
          set({ items: get().items.map(i => i.productId === productId ? { ...i, quantity } : i) });
        }
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "ecommerce-cart" }
  )
);
