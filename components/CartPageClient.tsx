"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function CartPageClient() {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total());
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  if (!items.length) {
    return (
      <EmptyState
        title="Seu carrinho está vazio"
        description="Adicione produtos para revisar o pedido e avançar para o checkout."
      >
        <Button asChild>
          <Link href="/produtos">Ver produtos</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        {items.map((item) => {
          const image = item.product.images[0]?.url;

          return (
            <Card key={`${item.product.id}-${item.variation ?? "default"}`}>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-[96px_1fr_auto]">
                <div className="relative aspect-square overflow-hidden rounded-none bg-muted">
                  {image ? (
                    <Image
                      src={image}
                      alt={item.product.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <Link
                    href={`/produto/${item.product.slug}`}
                    className="font-semibold hover:text-primary"
                  >
                    {item.product.name}
                  </Link>
                  {item.variation ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.variation}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatCurrency(item.product.price)} cada
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className="flex items-center rounded-none border-2 border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label="Diminuir quantidade"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1, item.variation)
                      }
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label="Aumentar quantidade"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1, item.variation)
                      }
                    >
                      <Plus />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover item"
                    onClick={() => removeItem(item.product.id, item.variation)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Resumo do pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frete</span>
            <span className="font-semibold">Calculado no atendimento</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-black">{formatCurrency(total)}</span>
          </div>
          <Button asChild size="lg">
            <Link href="/checkout">Finalizar compra</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
