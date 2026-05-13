import type { CartItem } from "@/types/order";

export function getCartItemTotal(item: CartItem) {
  return item.product.price * item.quantity;
}

export function getCartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + getCartItemTotal(item), 0);
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((count, item) => count + item.quantity, 0);
}
