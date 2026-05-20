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
  type CouponAppliesTo,
  type CouponDiscountType,
  type DiscountCoupon,
} from "@/lib/coupons";
import type { Category } from "@/types/product";

type CouponManagerProps = {
  coupons: DiscountCoupon[];
  categories: Category[];
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
    minimumQuantity: 0,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    usageLimitPerCustomer: null,
    usedCount: 0,
    appliesTo: "order",
    categoryIds: [],
    excludeSaleItems: false,
    enabled: true,
  };
}

function toInputDateTime(value?: string | null) {
  return value ? value.slice(0, 16) : "";
}

function optionalNumber(value: string) {
  return value ? Number(value) : null;
}

export function CouponManager({ coupons, categories, action }: CouponManagerProps) {
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

  function toggleCategory(coupon: DiscountCoupon, categoryId: string) {
    updateCoupon(coupon.id, {
      categoryIds: coupon.categoryIds.includes(categoryId)
        ? coupon.categoryIds.filter((id) => id !== categoryId)
        : [...coupon.categoryIds, categoryId],
    });
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
            Controle validade, limites de uso, regras por categoria e bloqueio de itens em promoção.
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
                <div className="flex flex-wrap items-center gap-3">
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
                  <span className="border-2 border-border px-2 py-1 text-xs font-bold text-muted-foreground">
                    Usos: {coupon.usedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                  </span>
                </div>
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

              <div className="grid gap-3 border-2 border-border bg-muted/25 p-3 lg:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Quantidade mínima</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={coupon.minimumQuantity || ""}
                    placeholder="Sem mínimo"
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        minimumQuantity: Number(event.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Início do cupom</Label>
                  <Input
                    type="datetime-local"
                    value={toInputDateTime(coupon.startsAt)}
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        startsAt: event.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Fim do cupom</Label>
                  <Input
                    type="datetime-local"
                    value={toInputDateTime(coupon.endsAt)}
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        endsAt: event.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 border-2 border-border bg-muted/25 p-3 lg:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Limite total</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={coupon.usageLimit ?? ""}
                    placeholder="Ilimitado"
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        usageLimit: optionalNumber(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Limite por cliente</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={coupon.usageLimitPerCustomer ?? ""}
                    placeholder="Ilimitado"
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        usageLimitPerCustomer: optionalNumber(event.target.value),
                      })
                    }
                  />
                </div>
                <label className="flex items-center gap-2 self-end border-2 border-border bg-background px-3 py-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={coupon.excludeSaleItems}
                    onChange={(event) =>
                      updateCoupon(coupon.id, {
                        excludeSaleItems: event.target.checked,
                      })
                    }
                  />
                  Excluir produtos em promoção
                </label>
              </div>

              <div className="grid gap-3 border-2 border-border bg-muted/25 p-3">
                <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
                  <div className="grid gap-2">
                    <Label>Aplicar em</Label>
                    <select
                      value={coupon.appliesTo}
                      onChange={(event) =>
                        updateCoupon(coupon.id, {
                          appliesTo: event.target.value as CouponAppliesTo,
                          categoryIds:
                            event.target.value === "categories"
                              ? coupon.categoryIds
                              : [],
                        })
                      }
                      className="focus-ring h-10 rounded-none border-2 border-border bg-background px-3 text-sm shadow-xs"
                    >
                      <option value="order">Pedido inteiro</option>
                      <option value="categories">Categorias selecionadas</option>
                    </select>
                  </div>
                  {coupon.appliesTo === "categories" ? (
                    <div className="grid gap-2">
                      <Label>Categorias</Label>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center gap-2 border-2 border-border bg-background px-3 py-2 text-sm font-bold"
                          >
                            <input
                              type="checkbox"
                              className="size-4 accent-primary"
                              checked={coupon.categoryIds.includes(category.id)}
                              onChange={() => toggleCategory(coupon, category.id)}
                            />
                            {category.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
