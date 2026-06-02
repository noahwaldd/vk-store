"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  getStockForVariationSelection,
  getVariationValueStock,
} from "@/lib/variation-stock";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types/product";

type ProductDetailActionsProps = {
  product: Product;
};

function normalizeVariationKey(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function getVariationImageUrl(
  imageByValue: Record<string, string> | undefined,
  value: string | undefined,
) {
  if (!imageByValue || !value) {
    return undefined;
  }

  return (
    imageByValue[value] ??
    Object.entries(imageByValue).find(
      ([key]) => normalizeVariationKey(key) === normalizeVariationKey(value),
    )?.[1]
  );
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const variationGroups = useMemo(
    () =>
      product.variations
        .filter((variation) => variation.values.length)
        .map((variation, index) => ({
          ...variation,
          key: `${variation.label}-${index}`,
        })),
    [product.variations],
  );
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        variationGroups.map((variation) => [
          variation.key,
          variation.values.find((value) => {
            const valueStock = getVariationValueStock(variation, value);

            return valueStock === null ? product.stock > 0 : valueStock > 0;
          }) ??
            variation.values[0] ??
            "",
        ]),
      ),
  );
  const addItem = useCartStore((state) => state.addItem);
  const selectedStock = useMemo(
    () => getStockForVariationSelection(product, Object.values(selectedVariations)),
    [product, selectedVariations],
  );

  const variationLabel = useMemo(() => {
    if (!variationGroups.length) {
      return undefined;
    }

    const selected = variationGroups
      .map((variation) => ({
        label: variation.label,
        value: selectedVariations[variation.key],
      }))
      .filter((variation) => variation.value);

    return selected.length
      ? selected.map((variation) => `${variation.label}: ${variation.value}`).join(" / ")
      : undefined;
  }, [selectedVariations, variationGroups]);
  const selectedImageUrl = useMemo(() => {
    for (const variation of variationGroups) {
      const imageUrl = getVariationImageUrl(
        variation.imageByValue,
        selectedVariations[variation.key],
      );

      if (imageUrl) {
        return imageUrl;
      }
    }

    return undefined;
  }, [selectedVariations, variationGroups]);

  useEffect(() => {
    if (!selectedImageUrl) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("vkstore:variation-image", {
        detail: {
          imageUrl: selectedImageUrl,
        },
      }),
    );
  }, [selectedImageUrl]);

  function handleAdd() {
    addItem({ ...product, stock: selectedStock }, variationLabel);
    toast.success("Produto pronto no carrinho.", {
      id: `cart-add-${product.id}-${variationLabel ?? "default"}`,
    });
  }

  return (
    <div className="grid min-w-0 gap-4">
      {variationGroups.map((variation) => (
        <div key={variation.key} className="min-w-0">
          <p className="mb-2 break-words text-sm font-semibold">{variation.label}</p>
          <div className="flex min-w-0 flex-wrap gap-2">
            {variation.values.map((value) => {
              const selected = selectedVariations[variation.key] === value;
              const valueStock = getVariationValueStock(variation, value);
              const unavailable = valueStock === null ? product.stock <= 0 : valueStock <= 0;

              return (
                <Button
                  key={value}
                  type="button"
                  variant={selected ? "secondary" : "outline"}
                  disabled={unavailable}
                  className={`btn-variant max-w-full min-w-0 whitespace-normal px-3 ${
                    selected ? "selected" : ""
                  } ${unavailable ? "btn-variant-no-stock" : ""}`}
                  onClick={() =>
                    setSelectedVariations((current) => ({
                      ...current,
                      [variation.key]: value,
                    }))
                  }
                  title={value}
                >
                  <span
                    className="btn-variant-content block max-w-[9.5rem] truncate sm:max-w-[12rem]"
                    data-name={value}
                  >
                    {value}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      ))}

      <Button
        onClick={handleAdd}
        disabled={selectedStock <= 0}
        className="add-cart-cta h-11"
      >
        <ShoppingCart />
        Comprar
      </Button>
    </div>
  );
}
