"use client";

import { useState, useTransition } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { updateCheckoutProfileAction } from "@/app/conta/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBrazilianPhone, onlyDigits } from "@/lib/input-format";
import type { CheckoutProfileFormValues } from "@/schemas/checkout-profile-schema";

type AccountCheckoutProfileFormProps = {
  initialProfile: CheckoutProfileFormValues;
  hasAcceptedLegal: boolean;
};

type CheckoutProfileField = keyof CheckoutProfileFormValues;

export function AccountCheckoutProfileForm({
  initialProfile,
  hasAcceptedLegal,
}: AccountCheckoutProfileFormProps) {
  const [values, setValues] = useState<CheckoutProfileFormValues>({
    ...initialProfile,
    phone: formatBrazilianPhone(initialProfile.phone),
  });
  const [isPending, startTransition] = useTransition();

  function updateField(field: CheckoutProfileField, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function resolveCep(rawCep = values.cep ?? "") {
    const cep = onlyDigits(rawCep);

    if (!cep) {
      return values;
    }

    if (cep.length !== 8) {
      return null;
    }

    const formattedCep = `${cep.slice(0, 5)}-${cep.slice(5)}`;

    setValues((current) => ({
      ...current,
      cep: formattedCep,
    }));
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
        return null;
      }

      const nextValues = {
        ...values,
        cep: formattedCep,
        address: data.logradouro ?? values.address,
        city: data.localidade ?? values.city,
        state: data.uf ?? values.state,
      };

      setValues((current) => ({
        ...current,
        address: data.logradouro ?? current.address,
        city: data.localidade ?? current.city,
        state: data.uf ?? current.state,
      }));
      return nextValues;
    } catch {
      return null;
    }
  }

  async function handleCepBlur(event: React.FocusEvent<HTMLInputElement>) {
    await resolveCep(event.currentTarget.value);
  }

  function handleCepKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void resolveCep(event.currentTarget.value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      let submitValues = values;
      const cep = onlyDigits(values.cep ?? "");
      const hasIncompleteAddress = Boolean(
        cep && (!values.address || !values.city || !values.state),
      );

      if (cep.length === 8 && hasIncompleteAddress) {
        const resolvedValues = await resolveCep(values.cep ?? "");

        if (!resolvedValues?.address || !resolvedValues.city || !resolvedValues.state) {
          toast.error("Complete o endereço antes de salvar o CEP.", {
            id: "account-profile-incomplete-cep",
          });
          return;
        }

        submitValues = resolvedValues;
      }

      const result = await updateCheckoutProfileAction(submitValues);

      if (!result.ok) {
        toast.error(result.message, {
          id: "account-profile-save",
        });
        return;
      }

      toast.success(result.message, {
        id: "account-profile-save",
      });
    });
  }

  return (
    <section className="border-2 border-foreground bg-background p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b-2 border-foreground pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Dados para pedidos
          </p>
          <h2 className="mt-2 text-2xl font-black">Preenchimento automático</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Esses dados entram no checkout e na mensagem do WhatsApp para você não preencher tudo de novo.
          </p>
        </div>
        {hasAcceptedLegal ? (
          <div className="inline-flex w-fit items-center gap-2 border-2 border-foreground bg-street-lime px-3 py-2 text-xs font-black uppercase">
            <ShieldCheck className="size-4" />
            Política aceita
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="checkout-name">Nome completo</Label>
            <Input
              id="checkout-name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkout-phone">Telefone/WhatsApp</Label>
            <Input
              id="checkout-phone"
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(event) =>
                updateField("phone", formatBrazilianPhone(event.target.value))
              }
              autoComplete="tel"
              maxLength={15}
              placeholder="(61) 99999-9999"
              required
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="checkout-email">E-mail para pedidos</Label>
            <Input
              id="checkout-email"
              type="email"
              inputMode="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkout-cep">CEP</Label>
            <Input
              id="checkout-cep"
              inputMode="numeric"
              value={values.cep ?? ""}
              onChange={(event) => updateField("cep", event.target.value)}
              onBlur={handleCepBlur}
              onKeyDown={handleCepKeyDown}
              autoComplete="postal-code"
              maxLength={9}
              placeholder="00000-000"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="checkout-address">Endereço</Label>
            <Input
              id="checkout-address"
              value={values.address ?? ""}
              onChange={(event) => updateField("address", event.target.value)}
              autoComplete="street-address"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkout-number">Número</Label>
            <Input
              id="checkout-number"
              value={values.number ?? ""}
              onChange={(event) => updateField("number", event.target.value)}
              autoComplete="address-line2"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkout-state">UF</Label>
            <Input
              id="checkout-state"
              value={values.state ?? ""}
              onChange={(event) => updateField("state", event.target.value.toUpperCase())}
              autoComplete="address-level1"
              maxLength={2}
            />
          </div>
          <div className="grid gap-2 md:col-span-4">
            <Label htmlFor="checkout-city">Cidade</Label>
            <Input
              id="checkout-city"
              value={values.city ?? ""}
              onChange={(event) => updateField("city", event.target.value)}
              autoComplete="address-level2"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="rounded-none">
            <Save className="size-4" />
            {isPending ? "Salvando..." : "Salvar dados"}
          </Button>
        </div>
      </form>
    </section>
  );
}
