"use client";

import { useLayoutEffect } from "react";

import { trackRecentlyViewedProduct } from "@/lib/recently-viewed";
import type { Product } from "@/types/product";

type ProductViewTrackerProps = {
  product: Product;
};

export function ProductViewTracker({ product }: ProductViewTrackerProps) {
  useLayoutEffect(() => {
    trackRecentlyViewedProduct(product);
  }, [product]);

  return null;
}
