"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const image = product.images[0]?.url;
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;

  function handleAddToCart() {
    addItem(product);
    toast.success("Produto adicionado ao carrinho.");
  }

  return (
    <Card data-animate className="group overflow-hidden p-0">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.images[0]?.alt ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Sem imagem
            </div>
          )}
          {hasDiscount ? (
            <Badge className="absolute left-3 top-3">
              Oferta
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="grid gap-3 p-4">
        <div className="min-h-16">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {product.category?.name ?? "Produto"}
          </p>
          <Link
            href={`/produto/${product.slug}`}
            className="mt-1 line-clamp-2 font-semibold hover:text-primary"
          >
            {product.name}
          </Link>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            {hasDiscount ? (
              <p className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.compare_at_price ?? 0)}
              </p>
            ) : null}
            <p className="text-lg font-black">{formatCurrency(product.price)}</p>
          </div>
          <Badge variant={product.stock > 0 ? "muted" : "outline"}>
            {product.stock > 0 ? `${product.stock} un.` : "Esgotado"}
          </Badge>
        </div>

        <Button onClick={handleAddToCart} disabled={product.stock <= 0} className="w-full">
          <ShoppingCart />
          Adicionar
        </Button>
      </div>
    </Card>
  );
}
