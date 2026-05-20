import type { CartItem } from "@/types/order";

export type CouponDiscountType = "percentage" | "fixed";
export type CouponAppliesTo = "order" | "categories";

export type DiscountCoupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumSubtotal: number;
  minimumQuantity: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageLimitPerCustomer: number | null;
  usedCount: number;
  appliesTo: CouponAppliesTo;
  categoryIds: string[];
  excludeSaleItems: boolean;
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

export function isCouponDateActive(coupon: DiscountCoupon, now = new Date()) {
  const startsAt = coupon.startsAt ? new Date(coupon.startsAt) : null;
  const endsAt = coupon.endsAt ? new Date(coupon.endsAt) : null;

  if (
    (startsAt && Number.isNaN(startsAt.getTime())) ||
    (endsAt && Number.isNaN(endsAt.getTime()))
  ) {
    return false;
  }

  if (startsAt && now < startsAt) {
    return false;
  }

  if (endsAt && now > endsAt) {
    return false;
  }

  return true;
}

export function isCouponUsageAvailable(coupon: DiscountCoupon) {
  return coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit;
}

export function isCouponOperational(coupon: DiscountCoupon) {
  return (
    coupon.enabled &&
    isCouponDateActive(coupon) &&
    isCouponUsageAvailable(coupon)
  );
}

function getCartQuantity(items: CartItem[]) {
  return items.reduce((quantity, item) => quantity + item.quantity, 0);
}

function isSaleItem(item: CartItem) {
  return (
    typeof item.product.compare_at_price === "number" &&
    item.product.compare_at_price > item.product.price
  );
}

export function getCouponEligibleItems(items: CartItem[], coupon: DiscountCoupon) {
  return items.filter((item) => {
    if (coupon.excludeSaleItems && isSaleItem(item)) {
      return false;
    }

    if (coupon.appliesTo === "categories") {
      return Boolean(
        item.product.category_id && coupon.categoryIds.includes(item.product.category_id),
      );
    }

    return true;
  });
}

export function calculateCouponDiscount(
  subtotal: number,
  coupon: DiscountCoupon,
  eligibleSubtotal = subtotal,
  quantity = 0,
) {
  if (
    !isCouponOperational(coupon) ||
    subtotal <= 0 ||
    eligibleSubtotal <= 0 ||
    subtotal < coupon.minimumSubtotal ||
    quantity < coupon.minimumQuantity
  ) {
    return 0;
  }

  const discount =
    coupon.discountType === "percentage"
      ? eligibleSubtotal * (coupon.discountValue / 100)
      : coupon.discountValue;

  return Math.min(Math.max(Math.round(discount * 100) / 100, 0), eligibleSubtotal);
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
  const eligibleItems = getCouponEligibleItems(items, coupon);
  const eligibleSubtotal = getCartSubtotal(eligibleItems);
  const eligibleQuantity = getCartQuantity(eligibleItems);
  const discount = calculateCouponDiscount(
    subtotal,
    coupon,
    eligibleSubtotal,
    eligibleQuantity,
  );

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
  coupon?: DiscountCoupon,
): CartItem[] {
  const discountableItems = coupon ? getCouponEligibleItems(items, coupon) : items;
  const subtotal = getCartSubtotal(discountableItems);

  if (discount <= 0 || subtotal <= 0) {
    return items;
  }

  const ratio = Math.max((subtotal - discount) / subtotal, 0);
  const discountableKeys = new Set(
    discountableItems.map(
      (item) => `${item.product.id}:${item.variation ?? "default"}`,
    ),
  );

  return items.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: discountableKeys.has(`${item.product.id}:${item.variation ?? "default"}`)
        ? Math.max(Math.round(item.product.price * ratio * 100) / 100, 0.01)
        : item.product.price,
    },
  }));
}
