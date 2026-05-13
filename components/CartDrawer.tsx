"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const count = useCartStore((state) => state.count());
  const total = useCartStore((state) => state.total());
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir carrinho" className="relative">
          <ShoppingBag />
          {count > 0 ? (
            <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {count}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Carrinho</SheetTitle>
          <SheetDescription>Revise os itens antes de finalizar a compra.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="rounded-none border-2 border-dashed border-foreground p-8 text-center text-sm text-muted-foreground">
              Seu carrinho está vazio.
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => {
                const image = item.product.images[0]?.url;

                return (
                  <div
                    key={`${item.product.id}-${item.variation ?? "default"}`}
                    className="grid grid-cols-[72px_1fr] gap-3"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-none bg-muted">
                      {image ? (
                        <Image
                          src={image}
                          alt={item.product.name}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/produto/${item.product.slug}`}
                        className="line-clamp-2 text-sm font-semibold hover:text-primary"
                      >
                        {item.product.name}
                      </Link>
                      {item.variation ? (
                        <p className="mt-1 text-xs text-muted-foreground">{item.variation}</p>
                      ) : null}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-none border-2 border-border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Diminuir quantidade"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.variation,
                              )
                            }
                          >
                            <Minus />
                          </Button>
                          <span className="w-7 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Aumentar quantidade"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.variation,
                              )
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
                      <p className="mt-2 text-sm font-bold">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <SheetFooter>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-lg font-black">{formatCurrency(total)}</span>
          </div>
          <Button asChild size="lg" disabled={items.length === 0}>
            <Link href="/checkout">Finalizar compra</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/carrinho">Ver carrinho</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
