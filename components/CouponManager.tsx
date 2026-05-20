"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { CouponActionResult } from "@/app/admin/cupons/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  normalizeCouponCode,
  type CouponDiscountType,
  type DiscountCoupon,
} from "@/lib/coupons";

type CouponManagerProps = {
  coupons: DiscountCoupon[];
  action: (formData: FormData) => Promise<CouponActionResult>;
};

function createCoupon(): DiscountCoupon {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `coupon-${crypto.randomUUID()}`
      : `coupon-${Date.now()}`;

  return {
    id,
    code: "BEMVINDO",
    title: "5% de desconto",
    description: "Cupom disponível por tempo limitado.",
    discountType: "percentage",
    discountValue: 5,
    minimumSubtotal: 0,
    enabled: true,
  };
}

export function CouponManager({ coupons, action }: CouponManagerProps) {
  const [items, setItems] = useState(coupons);
  const [savedItems, setSavedItems] = useState(coupons);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasChanges = JSON.stringify(items) !== JSON.stringify(savedItems);

  function updateCoupon(id: string, patch: Partial<DiscountCoupon>) {
    setItems((current) =>
      current.map((coupon) =>
        coupon.id === id
          ? {
              ...coupon,
              ...patch,
            }
          : coupon,
      ),
    );
  }

  function removeCoupon(id: string) {
    setItems((current) => current.filter((coupon) => coupon.id !== id));
  }

  return (
    <form
      action={async () => {
        const formData = new FormData();
        formData.append(
          "coupons",
          JSON.stringify(
            items.map((coupon) => ({
              ...coupon,
              code: normalizeCouponCode(coupon.code),
            })),
          ),
        );
        setIsSubmitting(true);

        try {
          const result = await action(formData);

          if (result.ok) {
            toast.success(result.message);
            const normalizedItems = items.map((coupon) => ({
              ...coupon,
              code: normalizeCouponCode(coupon.code),
            }));
            setItems(normalizedItems);
            setSavedItems(normalizedItems);
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Não foi possível salvar os cupons.",
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="grid gap-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Cupons cadastrados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cupons ativos aparecem no botão pulsante da loja e podem ser usados no carrinho.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, createCoupon()])}>
          <Plus />
          Novo cupom
        </Button>
      </div>

      {items.length ? (
        <div className="grid gap-3">
          {items.map((coupon) => (
            <section
              key={coupon.id}
              className="grid gap-4 border-2 border-foreground bg-background p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm font-black">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={coupon.enabled}
                    onChange={(event) =>
                      updateCoupon(coupon.id, { enabled: event.target.checked })
                    }
                  />
                  {coupon.enabled ? "Ativo" : "Desativado"}
                </label>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeCoupon(coupon.id)}
                >
                  <Trash2 />
                  Remover
                </Button>
              </div>

              <div className="grid gap-3 lg:grid-cols-[180px_1fr_180px_180px]">
                <div className="grid gap-2">
                  <Label>Código</Label>
                  <Input
                    value={coupon.code}
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        code: normalizeCouponCode(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Título</Label>
                  <Input
                    value={coupon.title}
                    onChange={(event) =>
                      updateCoupon(coupon.id, { title: event.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <select
                    value={coupon.discountType}
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        discountType: event.target.value as CouponDiscountType,
                      })
                    }
                    className="focus-ring h-10 rounded-none border-2 border-border bg-background px-3 text-sm shadow-xs"
                  >
                    <option value="percentage">Percentual</option>
                    <option value="fixed">Valor fixo</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Desconto</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={coupon.discountValue}
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        discountValue: Number(event.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
                <div className="grid gap-2">
                  <Label>Mínimo do carrinho</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={coupon.minimumSubtotal}
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        minimumSubtotal: Number(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea
                    rows={2}
                    value={coupon.description}
                    onChange={(event) =>
                      updateCoupon(coupon.id, { description: event.target.value })
                    }
                  />
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          Nenhum cupom cadastrado. Crie um cupom para liberar o botão pulsante na loja.
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !hasChanges}
        className="w-fit"
      >
        <Save />
        {isSubmitting ? "Salvando..." : "Salvar cupons"}
      </Button>
    </form>
  );
}
