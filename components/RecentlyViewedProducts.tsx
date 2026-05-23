"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ruler, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getRecentlyViewedProducts,
  type RecentlyViewedProduct,
} from "@/lib/recently-viewed";
import { formatCurrency } from "@/lib/utils";
import { hydrateCartStore, useCartStore } from "@/store/cart-store";

type RecentlyViewedProductsProps = {
  limit?: number;
  compact?: boolean;
};

function hasDiscount(product: RecentlyViewedProduct) {
  return (
    typeof product.compare_at_price === "number" &&
    product.compare_at_price > product.price
  );
}

function getVariationSummary(product: RecentlyViewedProduct) {
  const variation = product.variations[0];

  if (!variation?.values.length) {
    return null;
  }

  const visibleValues = variation.values.slice(0, 5);
  const hiddenCount = variation.values.length - visibleValues.length;

  return `${variation.label}: ${visibleValues.join(", ")}${
    hiddenCount > 0 ? ` +${hiddenCount}` : ""
  }`;
}

export function RecentlyViewedProducts({
  limit = 4,
  compact = false,
}: RecentlyViewedProductsProps) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const productsInCart = useMemo(
    () => new Set(items.map((item) => item.product.id)),
    [items],
  );
  const visibleProducts = products
    .filter((product) => product.stock > 0 && !productsInCart.has(product.id))
    .slice(0, limit);

  useEffect(() => {
    function loadProducts() {
      setProducts(getRecentlyViewedProducts());
    }

    void hydrateCartStore().then(loadProducts);
    window.addEventListener("storage", loadProducts);
    window.addEventListener("vkstore-recently-viewed", loadProducts);

    return () => {
      window.removeEventListener("storage", loadProducts);
      window.removeEventListener("vkstore-recently-viewed", loadProducts);
    };
  }, []);

  function handleAdd(product: RecentlyViewedProduct) {
    addItem(product);
    toast.success("Produto adicionado ao carrinho.", {
      id: `cart-add-${product.id}`,
    });
  }

  if (!visibleProducts.length) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <div>
        <h2 className={compact ? "text-base font-black" : "text-xl font-black"}>
          Produtos que você viu
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Salvos neste navegador para você voltar rápido.
        </p>
      </div>

      <div className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"}>
        {visibleProducts.map((product) => {
          const image = product.images[0]?.url;
          const variationSummary = getVariationSummary(product);
          const requiresChoice = Boolean(variationSummary);
          const discounted = hasDiscount(product);
          const isOffer = Boolean(discounted && product.is_offer);

          return (
            <article
              key={product.id}
              className={
                compact
                  ? "grid grid-cols-[72px_1fr] gap-3 border-2 border-border bg-background p-2"
                  : "grid overflow-hidden border-2 border-border bg-background transition-colors hover:border-foreground"
              }
            >
              <Link
                href={`/produto/${product.slug}`}
                className={
                  compact
                    ? "relative aspect-square overflow-hidden bg-muted"
                    : "relative aspect-[4/5] overflow-hidden bg-muted"
                }
              >
                {image ? (
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    sizes={compact ? "72px" : "260px"}
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : null}
              </Link>

              <div className={compact ? "min-w-0" : "grid gap-3 p-3"}>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="muted">
                    {product.category?.name ?? "Produto"}
                  </Badge>
                  {isOffer ? <Badge className="offer-badge">Oferta</Badge> : null}
                  {discounted && !isOffer ? (
                    <Badge variant="outline">Desconto</Badge>
                  ) : null}
                  <Badge variant={product.stock > 0 ? "outline" : "secondary"}>
                    {product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}
                  </Badge>
                </div>

                <div className="min-w-0">
                  <Link
                    href={`/produto/${product.slug}`}
                    className="line-clamp-2 text-sm font-black hover:text-primary"
                  >
                    {product.name}
                  </Link>
                  {!compact && product.description ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {product.description}
                    </p>
                  ) : null}
                  {variationSummary ? (
                    <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Ruler className="size-3.5" />
                      {variationSummary}
                    </p>
                  ) : null}
                </div>

                <div>
                  {discounted ? (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatCurrency(product.compare_at_price ?? 0)}
                    </p>
                  ) : null}
                  <p className="text-lg font-black">{formatCurrency(product.price)}</p>
                </div>

                {requiresChoice ? (
                  <Button asChild size={compact ? "sm" : "default"} className="w-full">
                    <Link href={`/produto/${product.slug}`}>
                      <ShoppingCart />
                      Escolher tamanho
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size={compact ? "sm" : "default"}
                    className="w-full"
                    onClick={() => handleAdd(product)}
                  >
                    <ShoppingCart />
                    Adicionar
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
