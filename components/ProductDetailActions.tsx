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
  const firstVariation = product.variations[0];
  const [selectedVariation, setSelectedVariation] = useState(
    firstVariation?.values[0] ?? "",
  );
  const addItem = useCartStore((state) => state.addItem);

  const variationLabel = useMemo(() => {
    if (!firstVariation || !selectedVariation) {
      return undefined;
    }

    return selectedVariation;
  }, [firstVariation, selectedVariation]);

  function handleAdd() {
    addItem(product, variationLabel);
    toast.success("Produto adicionado ao carrinho.");
  }

  return (
    <div className="grid gap-5">
      {firstVariation ? (
        <div>
          <p className="mb-3 text-sm font-semibold">{firstVariation.label}</p>
          <div className="flex flex-wrap gap-2">
            {firstVariation.values.map((value) => (
              <Button
                key={value}
                type="button"
                variant={selectedVariation === value ? "secondary" : "outline"}
                disabled={product.stock <= 0}
                className={`btn-variant ${
                  selectedVariation === value ? "selected" : ""
                } ${product.stock <= 0 ? "btn-variant-no-stock" : ""}`}
                onClick={() => setSelectedVariation(value)}
                title={value}
              >
                <span className="btn-variant-content" data-name={value}>
                  {value}
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <Button
        size="lg"
        onClick={handleAdd}
        disabled={product.stock <= 0}
        className="add-cart-cta"
      >
        <ShoppingCart />
        Adicionar ao carrinho
      </Button>
    </div>
  );
}
