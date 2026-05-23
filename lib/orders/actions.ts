import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCartTotal } from "@/lib/cart";
import {
  applyCouponToItems,
  applyDiscountToCartItems,
  type DiscountCoupon,
} from "@/lib/coupons";
import {
  getStockForCartVariation,
  getVariationStockScopes,
  isCartVariationAllowed,
} from "@/lib/variation-stock";
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

function productHasVariations(product: CheckoutProduct) {
  return Array.isArray(product.variations) && product.variations.length > 0;
}

function normalizeCartProduct(
  product: CheckoutProduct,
  stock = product.stock,
): CartItem["product"] {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    stock,
    category_id: product.category_id,
    compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
    is_offer: product.is_offer,
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
  const quantityByStockScope = new Map<string, { quantity: number; stock: number }>();
  const quantityByProduct = new Map<string, number>();

  for (const requested of requestedItems) {
    const product = productsById.get(requested.productId);

    if (!product) {
      throw new Error("Um produto do carrinho não está mais disponível.");
    }

    const variationStock = getStockForCartVariation(product, requested.variation);

    if (variationStock <= 0) {
      throw new Error(`${product.name} está sem estoque.`);
    }

    if (productHasVariations(product) && !requested.variation) {
      throw new Error(`Selecione uma variação para ${product.name}.`);
    }

    if (requested.variation && !isCartVariationAllowed(product, requested.variation)) {
      throw new Error(`A variação escolhida para ${product.name} não está disponível.`);
    }

    const key = `${product.id}:${requested.variation ?? "default"}`;
    const existing = groupedItems.get(key);
    const nextQuantity = (existing?.quantity ?? 0) + requested.quantity;

    groupedItems.set(key, {
      product: normalizeCartProduct(product, variationStock),
      quantity: nextQuantity,
      variation: requested.variation,
    });

    const stockScopes = getVariationStockScopes(product, requested.variation);

    if (stockScopes.length) {
      for (const scope of stockScopes) {
        const scopedKey = `${product.id}:${scope.key}`;
        const current = quantityByStockScope.get(scopedKey);

        quantityByStockScope.set(scopedKey, {
          stock: scope.stock,
          quantity: (current?.quantity ?? 0) + requested.quantity,
        });
      }
    } else {
      quantityByProduct.set(
        product.id,
        (quantityByProduct.get(product.id) ?? 0) + requested.quantity,
      );
    }
  }

  const items = [...groupedItems.values()];

  for (const item of items) {
    if (item.quantity > item.product.stock) {
      throw new Error(`Estoque insuficiente para ${item.product.name}.`);
    }
  }

  for (const [productId, quantity] of quantityByProduct) {
    const product = productsById.get(productId);

    if (!product || quantity > product.stock) {
      throw new Error(`Estoque insuficiente para ${product?.name ?? "produto"}.`);
    }
  }

  for (const [, scope] of quantityByStockScope) {
    if (scope.quantity > scope.stock) {
      throw new Error("Estoque insuficiente para uma variação do carrinho.");
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
  customer: { name: string; email: string; phone: string };
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

    if (appliedCoupon?.coupon.usageLimit) {
      const totalUses = await tx.order.count({
        where: {
          coupon_code: appliedCoupon.coupon.code,
          status: {
            not: "canceled",
          },
        },
      });

      if (totalUses >= appliedCoupon.coupon.usageLimit) {
        throw new Error("Esse cupom atingiu o limite de uso.");
      }
    }

    if (appliedCoupon?.coupon.usageLimitPerCustomer) {
      const customerUses = await tx.order.count({
        where: {
          coupon_code: appliedCoupon.coupon.code,
          status: {
            not: "canceled",
          },
          customer: {
            email: customer.email,
          },
        },
      });

      if (customerUses >= appliedCoupon.coupon.usageLimitPerCustomer) {
        throw new Error("Esse cupom já atingiu o limite para sua conta.");
      }
    }

    const orderItems = appliedCoupon
      ? applyDiscountToCartItems(
          canonicalItems,
          appliedCoupon.discount,
          appliedCoupon.coupon,
        )
      : canonicalItems;

    // Public checkout only validates availability. Stock changes must happen
    // in an operational fulfillment flow after the WhatsApp order is confirmed.
    const customerData = await tx.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        document: null,
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
        coupon_code: appliedCoupon?.coupon.code ?? null,
        coupon_discount: appliedCoupon?.discount ?? null,
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
