"use client";

import type { Product } from "@/types/product";

export type RecentlyViewedProduct = Pick<
  Product,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "price"
  | "compare_at_price"
  | "stock"
  | "category_id"
  | "images"
  | "category"
  | "variations"
  | "featured"
  | "is_offer"
>;

const recentlyViewedKey = "vkstore-recently-viewed";
const maxRecentlyViewed = 8;

function toRecentlyViewedProduct(product: Product): RecentlyViewedProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    compare_at_price: product.compare_at_price,
    stock: product.stock,
    category_id: product.category_id,
    images: product.images,
    category: product.category,
    variations: product.variations,
    featured: product.featured,
    is_offer: product.is_offer,
  };
}

function parseRecentlyViewed(value: string | null): RecentlyViewedProduct[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item): RecentlyViewedProduct[] => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const product = item as Partial<RecentlyViewedProduct>;

      if (
        typeof product.id !== "string" ||
        typeof product.name !== "string" ||
        typeof product.slug !== "string" ||
        typeof product.price !== "number"
      ) {
        return [];
      }

      return [
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description:
            typeof product.description === "string" ? product.description : "",
          price: product.price,
          compare_at_price:
            typeof product.compare_at_price === "number"
              ? product.compare_at_price
              : null,
          stock: typeof product.stock === "number" ? product.stock : 0,
          category_id:
            typeof product.category_id === "string" ? product.category_id : null,
          images: Array.isArray(product.images) ? product.images : [],
          category: product.category ?? null,
          variations: Array.isArray(product.variations) ? product.variations : [],
          featured: Boolean(product.featured),
          is_offer: Boolean(product.is_offer),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function getRecentlyViewedProducts() {
  if (typeof window === "undefined") {
    return [];
  }

  return parseRecentlyViewed(window.localStorage.getItem(recentlyViewedKey));
}

export function trackRecentlyViewedProduct(product: Product) {
  if (typeof window === "undefined") {
    return [];
  }

  const viewedProduct = toRecentlyViewedProduct(product);
  const products = [
    viewedProduct,
    ...getRecentlyViewedProducts().filter((item) => item.id !== viewedProduct.id),
  ].slice(0, maxRecentlyViewed);

  window.localStorage.setItem(recentlyViewedKey, JSON.stringify(products));
  window.dispatchEvent(new Event("vkstore-recently-viewed"));

  return products;
}
