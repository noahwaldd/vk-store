"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, TicketPercent, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  applyCouponToItems,
  getCouponLabel,
  type DiscountCoupon,
} from "@/lib/coupons";
import { formatCurrency } from "@/lib/utils";
import { hydrateCartStore, useCartStore } from "@/store/cart-store";

type CouponDrawerProps = {
  coupons: DiscountCoupon[];
};

export function CouponDrawer({ coupons }: CouponDrawerProps) {
  const [activeTab, setActiveTab] = useState<"available" | "history">("available");
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const clearCoupon = useCartStore((state) => state.clearCoupon);
  const availableCoupons = useMemo(
    () => coupons.filter((coupon) => coupon.enabled),
    [coupons],
  );
  const appliedCoupon = applyCouponToItems(items, availableCoupons, couponCode);

  useEffect(() => {
    void hydrateCartStore();
  }, []);

  if (!availableCoupons.length) {
    return null;
  }

  function handleApply(coupon: DiscountCoupon) {
    const result = applyCouponToItems(items, availableCoupons, coupon.code);

    if (!items.length) {
      toast.error("Adicione produtos ao carrinho antes de usar um cupom.");
      return;
    }

    if (!result) {
      toast.error(
        coupon.minimumSubtotal > 0
          ? `Esse cupom vale a partir de ${formatCurrency(coupon.minimumSubtotal)}.`
          : "Esse cupom não pode ser usado neste carrinho.",
      );
      return;
    }

    applyCoupon(coupon.code);
    toast.success(`Cupom ${coupon.code} aplicado.`);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          aria-label="Abrir cupons de desconto"
          className="coupon-floating-button"
        >
          <TicketPercent className="size-5" />
          <span className="coupon-floating-label">Cupons</span>
          {appliedCoupon ? (
            <span className="coupon-floating-status absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-foreground bg-street-lime text-[10px] text-foreground">
              <Check className="size-3" />
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="left-1/2 max-h-[90dvh] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-t-2xl border-2 border-b-0 border-foreground bg-background p-0"
      >
        <div className="flex flex-shrink-0 items-center justify-center pb-2 pt-5">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <SheetHeader className="items-center px-6 pb-2 text-center">
          <SheetTitle className="text-base font-black">Cupons de Desconto</SheetTitle>
          <SheetDescription>
            Adicione cupom de desconto no carrinho.
          </SheetDescription>
        </SheetHeader>

        <nav className="flex border-b-2 border-border px-6">
          <button
            type="button"
            className={`flex-1 border-b-2 py-2 text-sm font-black ${
              activeTab === "available"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
            onClick={() => setActiveTab("available")}
          >
            Disponíveis
          </button>
          <button
            type="button"
            className={`flex-1 border-b-2 py-2 text-sm font-black ${
              activeTab === "history"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
            onClick={() => setActiveTab("history")}
          >
            Histórico
          </button>
        </nav>

        <div className="max-h-[calc(90dvh-152px)] overflow-y-auto px-6 py-4">
          {activeTab === "available" ? (
            <div className="grid gap-3">
              {availableCoupons.map((coupon) => {
                const selected = couponCode === coupon.code;
                const result = applyCouponToItems(items, availableCoupons, coupon.code);

                return (
                  <button
                    key={coupon.id}
                    type="button"
                    className={`grid grid-cols-[44px_1fr_auto] gap-3 border-2 p-4 text-left transition-colors ${
                      selected
                        ? "border-foreground bg-street-lime/35"
                        : "border-border bg-background hover:border-foreground hover:bg-muted/35"
                    }`}
                    onClick={() => handleApply(coupon)}
                  >
                    <span className="grid size-11 place-items-center border-2 border-foreground bg-foreground text-background">
                      <TicketPercent className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm font-black">
                        {coupon.title || getCouponLabel(coupon)}
                      </strong>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Usando o código {coupon.code}
                      </span>
                      {coupon.description ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {coupon.description}
                        </span>
                      ) : null}
                      <span className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="muted">{getCouponLabel(coupon)}</Badge>
                        {coupon.minimumSubtotal > 0 ? (
                          <Badge variant="outline">
                            A partir de {formatCurrency(coupon.minimumSubtotal)}
                          </Badge>
                        ) : null}
                      </span>
                    </span>
                    <span className="self-end text-xs font-black">
                      {selected ? "Aplicado" : result ? "Usar" : "Ver mais"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-3 text-center text-sm text-muted-foreground">
              {appliedCoupon ? (
                <div className="border-2 border-border p-4 text-left">
                  <p className="font-black text-foreground">
                    {appliedCoupon.coupon.code}
                  </p>
                  <p className="mt-1">
                    Desconto aplicado: {formatCurrency(appliedCoupon.discount)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      clearCoupon();
                      toast.success("Cupom removido.");
                    }}
                  >
                    <X />
                    Remover cupom
                  </Button>
                </div>
              ) : (
                <p>Nenhum cupom usado neste carrinho.</p>
              )}
            </div>
          )}
        </div>

        <SheetClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar"
            className="absolute right-4 top-3"
          >
            <X />
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
