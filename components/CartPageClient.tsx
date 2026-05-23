"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { RecentlyViewedProducts } from "@/components/RecentlyViewedProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartAvailabilitySync } from "@/components/useCartAvailabilitySync";
import { applyCouponToItems, type DiscountCoupon } from "@/lib/coupons";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

type CartPageClientProps = {
  coupons: DiscountCoupon[];
};

export function CartPageClient({ coupons }: CartPageClientProps) {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const availableItems = items.filter((item) => item.product.stock > 0);
  const hasUnavailableItems = availableItems.length !== items.length;
  const availableTotal = availableItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const appliedCoupon = applyCouponToItems(availableItems, coupons, couponCode);
  const finalTotal = appliedCoupon?.total ?? availableTotal;

  useCartAvailabilitySync();

  if (!items.length) {
    return (
      <div className="grid gap-6">
        <EmptyState
          title="Seu carrinho está vazio"
          description="Adicione produtos para revisar e finalizar o pedido pelo WhatsApp."
        >
          <Button asChild>
            <Link href="/produtos">Ver produtos</Link>
          </Button>
        </EmptyState>

        <RecentlyViewedProducts limit={4} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        {items.map((item) => {
          const image = item.product.images[0]?.url;
          const isUnavailable = item.product.stock <= 0;
          return (
            <Card key={`${item.product.id}-${item.variation ?? "default"}`}>
              <CardContent
                className={`grid gap-4 p-4 sm:grid-cols-[96px_1fr_auto] ${
                  isUnavailable ? "cart-item-unavailable" : ""
                }`}
              >
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
                  {isUnavailable ? (
                    <span className="mt-3 inline-flex border-2 border-destructive px-2 py-1 text-[11px] font-black uppercase text-destructive">
                      Esgotado
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className="flex items-center rounded-none border-2 border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      aria-label="Diminuir quantidade"
                      disabled={isUnavailable}
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
                      disabled={isUnavailable}
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
            <span className="font-semibold">{formatCurrency(availableTotal)}</span>
          </div>
          {appliedCoupon ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cupom {appliedCoupon.coupon.code}</span>
              <span className="font-semibold text-primary">
                -{formatCurrency(appliedCoupon.discount)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Atendimento</span>
            <span className="font-semibold">Finalizado pelo WhatsApp</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-black">{formatCurrency(finalTotal)}</span>
          </div>
          {hasUnavailableItems ? (
            <div className="border-2 border-destructive bg-destructive/10 p-3 text-xs font-bold text-destructive">
              Remova itens esgotados para finalizar.
            </div>
          ) : (
            <Button asChild size="lg" className="checkout-cta">
              <Link href="/checkout">Finalizar pedido</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
