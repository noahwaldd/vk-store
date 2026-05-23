"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getCartCount, getCartTotal } from "@/lib/cart";
import type { CartItem } from "@/types/order";
import type { Product } from "@/types/product";

type CartProduct = CartItem["product"];

type CartState = {
  items: CartItem[];
  couponCode: string | null;
  addItem: (product: Product | CartProduct, variation?: string) => void;
  applyCoupon: (code: string) => void;
  clearCoupon: () => void;
  replaceItems: (items: CartItem[]) => void;
  removeItem: (productId: string, variation?: string) => void;
  updateQuantity: (productId: string, quantity: number, variation?: string) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
};

function itemKey(productId: string, variation?: string) {
  return `${productId}:${variation ?? "default"}`;
}

function toCartProduct(product: Product | CartProduct): CartProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    stock: product.stock,
    images: product.images,
    category_id: product.category_id,
    compare_at_price: product.compare_at_price,
    is_offer: Boolean(product.is_offer),
  };
}

let cartHydrationPromise: Promise<void> | null = null;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
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
                product: toCartProduct(product),
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
      applyCoupon: (code) => set({ couponCode: code }),
      clearCoupon: () => set({ couponCode: null }),
      replaceItems: (items) =>
        set((state) => ({
          items,
          couponCode: items.length ? state.couponCode : null,
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
      clearCart: () => set({ items: [], couponCode: null }),
      total: () => getCartTotal(get().items),
      count: () => getCartCount(get().items),
    }),
    {
      name: "vkstore-cart",
      skipHydration: true,
    },
  ),
);

export function hydrateCartStore() {
  if (useCartStore.persist.hasHydrated()) {
    return Promise.resolve();
  }

  cartHydrationPromise ??= new Promise<void>((resolve) => {
    const unsubscribe = useCartStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });

    void useCartStore.persist.rehydrate();
  }).finally(() => {
    cartHydrationPromise = null;
  });

  return cartHydrationPromise;
}
