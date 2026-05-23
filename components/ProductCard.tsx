"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0]?.url;
  const variationSummary = product.variations
    .slice(0, 2)
    .map((variation) => {
      const visibleValues = variation.values.slice(0, 3);
      const hiddenCount = variation.values.length - visibleValues.length;

      return `${variation.label}: ${visibleValues.join(", ")}${
        hiddenCount > 0 ? ` +${hiddenCount}` : ""
      }`;
    })
    .join(" • ");
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const isOffer = Boolean(hasDiscount && product.is_offer);

  return (
    <Card data-animate className="group flex h-full flex-col overflow-hidden p-0">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.images[0]?.alt ?? product.name}
              fill
              sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Sem imagem
            </div>
          )}
          {isOffer ? (
            <Badge className="offer-badge absolute left-3 top-3">
              Oferta
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="min-h-[5.75rem]">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {product.category?.name ?? "Produto"}
          </p>
          <Link
            href={`/produto/${product.slug}`}
            className="mt-1 line-clamp-2 font-semibold hover:text-primary"
          >
            {product.name}
          </Link>
          {variationSummary ? (
            <p className="mt-2 line-clamp-1 text-xs font-medium text-muted-foreground">
              {variationSummary}
            </p>
          ) : null}
        </div>

        <div className="mt-auto grid gap-2.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              {hasDiscount ? (
                <p className="text-xs text-muted-foreground line-through">
                  {formatCurrency(product.compare_at_price ?? 0)}
                </p>
              ) : null}
              <p className="text-base font-black">{formatCurrency(product.price)}</p>
            </div>
            <Badge variant={product.stock > 0 ? "muted" : "outline"}>
              {product.stock > 0 ? `${product.stock} un.` : "Esgotado"}
            </Badge>
          </div>
          {hasDiscount && !isOffer ? (
            <Badge variant="outline" className="w-fit">
              Desconto
            </Badge>
          ) : null}

          {product.stock > 0 ? (
            <Button asChild className="add-cart-cta w-full">
              <Link href={`/produto/${product.slug}`}>
                <ShoppingCart />
                Comprar
              </Link>
            </Button>
          ) : (
            <Button disabled className="add-cart-cta w-full">
              <ShoppingCart />
              Esgotado
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
