"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutAction } from "@/app/checkout/actions";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { checkoutSchema, type CheckoutFormValues } from "@/schemas/checkout-schema";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total());
  const clearCart = useCartStore((state) => state.clearCart);
  const [isPending, startTransition] = useTransition();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
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
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createCheckoutAction(values, items);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setRedirectUrl(result.redirectUrl ?? null);
      setPreferenceId(result.preferenceId ?? null);

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
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
            Preencha os dados para finalizar o pedido com segurança.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="(61) 99999-9999" {...register("phone")} />
            {errors.phone ? (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="document">CPF/CNPJ</Label>
            <Input id="document" {...register("document")} />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="cep">CEP</Label>
            <Input id="cep" {...register("cep")} />
            {errors.cep ? (
              <p className="text-sm text-destructive">{errors.cep.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" {...register("address")} />
            {errors.address ? (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="number">Número</Label>
            <Input id="number" {...register("number")} />
            {errors.number ? (
              <p className="text-sm text-destructive">{errors.number.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" {...register("city")} />
            {errors.city ? (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state">UF</Label>
            <Input id="state" maxLength={2} {...register("state")} />
            {errors.state ? (
              <p className="text-sm text-destructive">{errors.state.message}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => clearCart()}>
            Limpar carrinho
          </Button>
          <Button type="submit" size="lg" disabled={isPending}>
            <CreditCard />
            {isPending ? "Preparando..." : "Finalizar pagamento"}
          </Button>
        </div>

        {preferenceId ? (
          <div className="rounded-none border-2 border-border bg-muted p-3 text-sm">
            Pedido preparado: <strong>{preferenceId}</strong>
            {redirectUrl ? (
              <Button asChild variant="link" className="ml-2">
                <a href={redirectUrl} target="_blank" rel="noreferrer">
                  Abrir checkout <ExternalLink />
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
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-black">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
