"use client";

import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types/product";

type ProductDetailActionsProps = {
  product: Product;
};

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
          variation.values[0] ?? "",
        ]),
      ),
  );
  const addItem = useCartStore((state) => state.addItem);

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

  function handleAdd() {
    addItem(product, variationLabel);
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

              return (
                <Button
                  key={value}
                  type="button"
                  variant={selected ? "secondary" : "outline"}
                  disabled={product.stock <= 0}
                  className={`btn-variant max-w-full min-w-0 whitespace-normal px-3 ${
                    selected ? "selected" : ""
                  } ${product.stock <= 0 ? "btn-variant-no-stock" : ""}`}
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
        disabled={product.stock <= 0}
        className="add-cart-cta h-11"
      >
        <ShoppingCart />
        Comprar
      </Button>
    </div>
  );
}
