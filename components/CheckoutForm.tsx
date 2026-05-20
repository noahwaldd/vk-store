"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ExternalLink, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutAction } from "@/app/checkout/actions";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { applyCouponToItems, type DiscountCoupon } from "@/lib/coupons";
import { checkoutSchema, type CheckoutFormValues } from "@/schemas/checkout-schema";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";

type CheckoutFormProps = {
  coupons: DiscountCoupon[];
};

export function CheckoutForm({ coupons }: CheckoutFormProps) {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);
  const total = useCartStore((state) => state.total());
  const clearCart = useCartStore((state) => state.clearCart);
  const [isPending, startTransition] = useTransition();
  const [cepStatus, setCepStatus] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document: "",
      cep: "",
      address: "",
      number: "",
      city: "",
      state: "",
      acceptPrivacy: false,
    },
  });
  const appliedCoupon = applyCouponToItems(items, coupons, couponCode);
  const finalTotal = appliedCoupon?.total ?? total;

  async function handleCepBlur(event: React.FocusEvent<HTMLInputElement>) {
    const cep = event.target.value.replace(/\D/g, "");

    if (!cep) {
      setCepStatus(null);
      return;
    }

    if (cep.length !== 8) {
      setCepStatus("Informe 8 dígitos para buscar o CEP.");
      return;
    }

    setValue("cep", `${cep.slice(0, 5)}-${cep.slice(5)}`, {
      shouldValidate: true,
    });
    setCepStatus("Buscando CEP...");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      if (!response.ok) {
        throw new Error("CEP indisponível.");
      }

      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        localidade?: string;
        uf?: string;
      };

      if (data.erro) {
        setCepStatus("CEP não encontrado. Preencha manualmente se desejar.");
        return;
      }

      setValue("address", data.logradouro ?? "", { shouldValidate: true });
      setValue("city", data.localidade ?? "", { shouldValidate: true });
      setValue("state", data.uf ?? "", { shouldValidate: true });
      setCepStatus("Endereço preenchido pelo CEP.");
    } catch {
      setCepStatus("Não foi possível buscar o CEP. Preencha manualmente se desejar.");
    }
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createCheckoutAction(values, items, couponCode);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setWhatsappUrl(result.whatsappUrl ?? null);
      setOrderId(result.orderId ?? null);

      if (result.whatsappUrl) {
        window.location.href = result.whatsappUrl;
        window.setTimeout(() => clearCart(), 1000);
      }
    });
  });

  if (!items.length) {
    return (
      <EmptyState
        title="Carrinho vazio"
        description="Escolha produtos antes de iniciar o checkout."
      >
        <Button asChild>
          <Link href="/produtos">Ver produtos</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <form onSubmit={onSubmit} className="grid gap-6 rounded-none border-2 border-foreground bg-background p-5">
        <div>
          <h2 className="text-xl font-black">Dados do cliente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe contato e, se quiser, um endereço de referência.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" autoComplete="name" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(61) 99999-9999"
              {...register("phone")}
            />
            {errors.phone ? (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="document">CPF/CNPJ</Label>
            <Input id="document" inputMode="numeric" autoComplete="off" {...register("document")} />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-base font-black">Endereço opcional</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use apenas se quiser adiantar a referência para atendimento.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              maxLength={9}
              {...register("cep", {
                onBlur: handleCepBlur,
              })}
            />
            {errors.cep ? (
              <p className="text-sm text-destructive">{errors.cep.message}</p>
            ) : null}
            {cepStatus ? (
              <p className="text-xs font-semibold text-muted-foreground">{cepStatus}</p>
            ) : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" autoComplete="street-address" {...register("address")} />
            {errors.address ? (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="number">Número</Label>
            <Input id="number" autoComplete="address-line2" {...register("number")} />
            {errors.number ? (
              <p className="text-sm text-destructive">{errors.number.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" autoComplete="address-level2" {...register("city")} />
            {errors.city ? (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state">UF</Label>
            <Input
              id="state"
              maxLength={2}
              autoComplete="address-level1"
              {...register("state")}
            />
            {errors.state ? (
              <p className="text-sm text-destructive">{errors.state.message}</p>
            ) : null}
          </div>
        </div>

        <label className="flex items-start gap-3 border-2 border-border bg-muted/40 p-3 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-primary"
            {...register("acceptPrivacy")}
          />
          <span>
            Li e aceito a{" "}
            <Link href="/privacidade" className="font-bold underline">
              Política de Privacidade
            </Link>{" "}
            e os{" "}
            <Link href="/termos" className="font-bold underline">
              Termos de Uso
            </Link>
            .
          </span>
        </label>
        {errors.acceptPrivacy ? (
          <p className="text-sm text-destructive">{errors.acceptPrivacy.message}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => clearCart()}>
            Limpar carrinho
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="checkout-cta h-auto min-h-12 whitespace-normal py-3 text-center leading-tight sm:whitespace-nowrap"
          >
            <MessageCircle />
            {isPending ? "Preparando WhatsApp..." : "Finalizar pedido pelo WhatsApp"}
          </Button>
        </div>

        {orderId ? (
          <div className="rounded-none border-2 border-border bg-muted p-3 text-sm">
            Pedido criado: <strong>{orderId}</strong>
            {whatsappUrl ? (
              <Button asChild variant="link" className="ml-2">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  Abrir WhatsApp <ExternalLink />
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {items.map((item) => {
            const image = item.product.images[0]?.url;

            return (
              <div
                key={`${item.product.id}-${item.variation ?? "default"}`}
                className="grid grid-cols-[64px_1fr_auto] gap-3"
              >
                <div className="relative aspect-square overflow-hidden rounded-none bg-muted">
                  {image ? (
                    <Image
                      src={image}
                      alt={item.product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">Qtd. {item.quantity}</p>
                </div>
                <p className="text-sm font-bold">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            );
          })}
          <Separator />
          {appliedCoupon ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cupom {appliedCoupon.coupon.code}</span>
              <span className="font-semibold text-primary">
                -{formatCurrency(appliedCoupon.discount)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-black">{formatCurrency(finalTotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
