"use client";

import { useState, useTransition } from "react";
import { Lock, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { updateAccountIdentityAction } from "@/app/conta/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBrazilianPhone } from "@/lib/input-format";

type AccountIdentityFormProps = {
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
};

export function AccountIdentityForm({
  name,
  email,
  phone,
  isAdmin,
}: AccountIdentityFormProps) {
  const [values, setValues] = useState({
    name,
    phone: formatBrazilianPhone(phone),
  });
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateAccountIdentityAction(values);

      if (!result.ok) {
        toast.error(result.message, {
          id: "account-identity-save",
        });
        return;
      }

      toast.success(result.message, {
        id: "account-identity-save",
      });
    });
  }

  return (
    <section className="border-2 border-foreground bg-background p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b-2 border-foreground pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Minha conta
          </p>
          <h2 className="mt-2 text-2xl font-black">Dados principais</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Nome e telefone aparecem no atendimento e nos pedidos. O e-mail fica bloqueado por segurança.
          </p>
        </div>
        {isAdmin ? (
          <div className="inline-flex w-fit items-center gap-2 border-2 border-foreground bg-street-lime px-3 py-2 text-xs font-black uppercase">
            <ShieldCheck className="size-4" />
            Admin
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="account-name">Nome completo</Label>
          <Input
            id="account-name"
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            autoComplete="name"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="account-phone">Telefone/WhatsApp</Label>
          <Input
            id="account-phone"
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                phone: formatBrazilianPhone(event.target.value),
              }))
            }
            autoComplete="tel"
            maxLength={15}
            placeholder="(61) 99999-9999"
            required
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="account-email">E-mail</Label>
          <div className="relative">
            <Input
              id="account-email"
              value={email}
              readOnly
              aria-readonly="true"
              className="pr-11 text-muted-foreground"
            />
            <Lock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex justify-end md:col-span-2">
          <Button type="submit" disabled={isPending} className="rounded-none">
            <Save className="size-4" />
            {isPending ? "Salvando..." : "Salvar dados da conta"}
          </Button>
        </div>
      </form>
    </section>
  );
}
