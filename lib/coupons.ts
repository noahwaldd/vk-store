import type { CartItem } from "@/types/order";

export type CouponDiscountType = "percentage" | "fixed";

export type DiscountCoupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumSubtotal: number;
  enabled: boolean;
};

export type AppliedCouponResult = {
  coupon: DiscountCoupon;
  subtotal: number;
  discount: number;
  total: number;
};

export const defaultCoupons: DiscountCoupon[] = [];

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function getCouponLabel(coupon: DiscountCoupon) {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}% de desconto`;
  }

  return `${coupon.discountValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })} de desconto`;
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
}

export function calculateCouponDiscount(
  subtotal: number,
  coupon: DiscountCoupon,
) {
  if (!coupon.enabled || subtotal <= 0 || subtotal < coupon.minimumSubtotal) {
    return 0;
  }

  const discount =
    coupon.discountType === "percentage"
      ? subtotal * (coupon.discountValue / 100)
      : coupon.discountValue;

  return Math.min(Math.max(Math.round(discount * 100) / 100, 0), subtotal);
}

export function findCouponByCode(coupons: DiscountCoupon[], code?: string | null) {
  const normalizedCode = normalizeCouponCode(code ?? "");

  if (!normalizedCode) {
    return null;
  }

  return (
    coupons.find((coupon) => normalizeCouponCode(coupon.code) === normalizedCode) ??
    null
  );
}

export function applyCouponToItems(
  items: CartItem[],
  coupons: DiscountCoupon[],
  code?: string | null,
): AppliedCouponResult | null {
  const coupon = findCouponByCode(coupons, code);

  if (!coupon) {
    return null;
  }

  const subtotal = getCartSubtotal(items);
  const discount = calculateCouponDiscount(subtotal, coupon);

  if (discount <= 0) {
    return null;
  }

  return {
    coupon,
    subtotal,
    discount,
    total: Math.max(Math.round((subtotal - discount) * 100) / 100, 0),
  };
}

export function applyDiscountToCartItems(
  items: CartItem[],
  discount: number,
): CartItem[] {
  const subtotal = getCartSubtotal(items);

  if (discount <= 0 || subtotal <= 0) {
    return items;
  }

  const ratio = Math.max((subtotal - discount) / subtotal, 0);

  return items.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: Math.max(Math.round(item.product.price * ratio * 100) / 100, 0.01),
    },
  }));
}
