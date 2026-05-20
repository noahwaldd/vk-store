"use server";

import { prisma } from "@/lib/db/prisma";
import type { CartItem } from "@/types/order";

function itemKey(item: CartItem) {
  return `${item.product.id}:${item.variation ?? "default"}`;
}

function getAllowedVariations(variations: unknown) {
  if (!Array.isArray(variations)) {
    return [];
  }

  return variations.flatMap((variation) => {
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

export async function syncCartItemsAction(items: CartItem[]) {
  const requestedItems = items
    .map((item) => ({
      productId: String(item.product?.id ?? ""),
      quantity: Math.max(1, Number(item.quantity) || 1),
      variation: item.variation?.trim() || undefined,
    }))
    .filter((item) => item.productId);

  if (!requestedItems.length) {
    return {
      items: [],
      removedCount: 0,
    };
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: [...new Set(requestedItems.map((item) => item.productId))],
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
  const productsById = new Map(products.map((product) => [product.id, product]));
  const syncedItems = new Map<string, CartItem>();

  for (const requested of requestedItems) {
    const product = productsById.get(requested.productId);

    if (!product) {
      continue;
    }

    const allowedVariations = getAllowedVariations(product.variations);

    if (
      requested.variation &&
      allowedVariations.length > 0 &&
      !allowedVariations.includes(requested.variation)
    ) {
      continue;
    }

    const stock = Math.max(product.stock, 0);
    const quantity = stock > 0 ? Math.min(requested.quantity, stock) : requested.quantity;
    const syncedItem: CartItem = {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        stock,
        images: product.images.map((image) => ({
          id: image.id,
          product_id: image.product_id,
          url: image.url,
          key: image.key,
          alt: image.alt,
          position: image.position,
        })),
      },
      quantity,
      variation: requested.variation,
    };
    const key = itemKey(syncedItem);
    const existing = syncedItems.get(key);

    syncedItems.set(
      key,
      existing
        ? {
            ...syncedItem,
            quantity:
              stock > 0
                ? Math.min(existing.quantity + quantity, stock)
                : existing.quantity + quantity,
          }
        : syncedItem,
    );
  }

  const synced = [...syncedItems.values()];

  return {
    items: synced,
    removedCount: requestedItems.length - synced.length,
  };
}
