import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCartTotal } from "@/lib/cart";
import {
  applyCouponToItems,
  applyDiscountToCartItems,
  type DiscountCoupon,
} from "@/lib/coupons";
import type { CartItem } from "@/types/order";

type CheckoutProduct = Prisma.ProductGetPayload<{
  include: {
    images: {
      orderBy: {
        position: "asc";
      };
    };
  };
}>;

function normalizeRequestedQuantity(quantity: unknown) {
  const value = Number(quantity);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Quantidade inválida no carrinho.");
  }

  return value;
}

function getAllowedVariations(product: CheckoutProduct) {
  if (!Array.isArray(product.variations)) {
    return [];
  }

  return product.variations.flatMap((variation) => {
    if (
      variation &&
      typeof variation === "object" &&
      "values" in variation &&
      Array.isArray(variation.values)
    ) {
      return variation.values.map((value: unknown) => String(value));
    }

    return [];
  });
}

function normalizeCartProduct(product: CheckoutProduct): CartItem["product"] {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    stock: product.stock,
    images: product.images.map((image) => ({
      id: image.id,
      product_id: image.product_id,
      url: image.url,
      key: image.key,
      alt: image.alt,
      position: image.position,
    })),
  };
}

export async function resolveCheckoutItems(items: CartItem[]) {
  const requestedItems = items
    .map((item) => ({
      productId: String(item.product?.id ?? ""),
      quantity: normalizeRequestedQuantity(item.quantity),
      variation: item.variation?.trim() || undefined,
    }))
    .filter((item) => item.productId);

  if (!requestedItems.length) {
    throw new Error("Adicione ao menos um produto ao carrinho.");
  }

  const productIds = [...new Set(requestedItems.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      deleted_at: null,
    },
    include: {
      images: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  return buildCanonicalCheckoutItems(requestedItems, products);
}

function buildCanonicalCheckoutItems(
  requestedItems: {
    productId: string;
    quantity: number;
    variation?: string;
  }[],
  products: CheckoutProduct[],
) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const groupedItems = new Map<string, CartItem>();

  for (const requested of requestedItems) {
    const product = productsById.get(requested.productId);

    if (!product) {
      throw new Error("Um produto do carrinho não está mais disponível.");
    }

    if (product.stock <= 0) {
      throw new Error(`${product.name} está sem estoque.`);
    }

    const allowedVariations = getAllowedVariations(product);

    if (allowedVariations.length > 0 && !requested.variation) {
      throw new Error(`Selecione uma variação para ${product.name}.`);
    }

    if (
      requested.variation &&
      allowedVariations.length > 0 &&
      !allowedVariations.includes(requested.variation)
    ) {
      throw new Error(`A variação escolhida para ${product.name} não está disponível.`);
    }

    const key = `${product.id}:${requested.variation ?? "default"}`;
    const existing = groupedItems.get(key);
    const nextQuantity = (existing?.quantity ?? 0) + requested.quantity;

    groupedItems.set(key, {
      product: normalizeCartProduct(product),
      quantity: nextQuantity,
      variation: requested.variation,
    });
  }

  const items = [...groupedItems.values()];
  const quantityByProduct = new Map<string, number>();

  for (const item of items) {
    quantityByProduct.set(
      item.product.id,
      (quantityByProduct.get(item.product.id) ?? 0) + item.quantity,
    );
  }

  for (const [productId, quantity] of quantityByProduct) {
    const product = productsById.get(productId);

    if (!product || quantity > product.stock) {
      throw new Error(`Estoque insuficiente para ${product?.name ?? "produto"}.`);
    }
  }

  return items;
}

export async function createOrderFromCart({
  items,
  customer,
  couponCode,
  coupons = [],
}: {
  items: CartItem[];
  customer: { name: string; email: string; phone: string; document?: string };
  couponCode?: string | null;
  coupons?: DiscountCoupon[];
}) {
  return prisma.$transaction(async (tx) => {
    const requestedItems = items
      .map((item) => ({
        productId: String(item.product?.id ?? ""),
        quantity: normalizeRequestedQuantity(item.quantity),
        variation: item.variation?.trim() || undefined,
      }))
      .filter((item) => item.productId);

    if (!requestedItems.length) {
      throw new Error("Adicione ao menos um produto ao carrinho.");
    }

    const productIds = [...new Set(requestedItems.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        deleted_at: null,
      },
      include: {
        images: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });
    const canonicalItems = buildCanonicalCheckoutItems(requestedItems, products);
    const appliedCoupon = applyCouponToItems(canonicalItems, coupons, couponCode);
    const orderItems = appliedCoupon
      ? applyDiscountToCartItems(canonicalItems, appliedCoupon.discount)
      : canonicalItems;

    // Public checkout only validates availability. Stock changes must happen
    // in an operational fulfillment flow after the WhatsApp order is confirmed.
    const customerData = await tx.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        document: customer.document || null,
      },
      select: {
        id: true,
      },
    });
    const total = getCartTotal(orderItems);
    const order = await tx.order.create({
      data: {
        customer_id: customerData.id,
        status: "pending",
        total,
        items: {
          create: orderItems.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            variation: item.variation ?? null,
          })),
        },
      },
      select: {
        id: true,
      },
    });

    return {
      orderId: order.id,
      items: orderItems,
      total,
      coupon: appliedCoupon,
    };
  });
}
