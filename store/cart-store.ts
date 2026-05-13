"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getCartCount, getCartTotal } from "@/lib/cart";
import type { CartItem } from "@/types/order";
import type { Product } from "@/types/product";

type CartProduct = CartItem["product"];

type CartState = {
  items: CartItem[];
  addItem: (product: Product | CartProduct, variation?: string) => void;
  removeItem: (productId: string, variation?: string) => void;
  updateQuantity: (productId: string, quantity: number, variation?: string) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
};

function itemKey(productId: string, variation?: string) {
  return `${productId}:${variation ?? "default"}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, variation) =>
        set((state) => {
          const key = itemKey(product.id, variation);
          const existing = state.items.find(
            (item) => itemKey(item.product.id, item.variation) === key,
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                itemKey(item.product.id, item.variation) === key
                  ? {
                      ...item,
                      quantity: Math.min(item.quantity + 1, product.stock),
                    }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                product: {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  stock: product.stock,
                  images: product.images,
                },
                quantity: 1,
                variation,
              },
            ],
          };
        }),
      removeItem: (productId, variation) =>
        set((state) => ({
          items: state.items.filter(
            (item) => itemKey(item.product.id, item.variation) !== itemKey(productId, variation),
          ),
        })),
      updateQuantity: (productId, quantity, variation) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              itemKey(item.product.id, item.variation) === itemKey(productId, variation)
                ? {
                    ...item,
                    quantity: Math.min(Math.max(quantity, 1), item.product.stock),
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
      total: () => getCartTotal(get().items),
      count: () => getCartCount(get().items),
    }),
    {
      name: "vkstore-cart",
    },
  ),
);
