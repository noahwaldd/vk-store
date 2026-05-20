"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { requestPasswordResetAction } from "@/app/esqueci-senha/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await requestPasswordResetAction(formData);
      setMessage(result.message);

      if (result.ok) {
        toast.success(result.message);
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <div className="w-full">
      <div className="mb-8 border-b-2 border-foreground pb-6">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Recuperação
        </p>
        <h1 className="mt-3 font-graffiti text-6xl leading-[0.9] text-foreground sm:text-7xl">
          Esqueci minha senha
        </h1>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Informe o e-mail da conta para receber um link de redefinição.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-mail"
          autoComplete="email"
          className="h-12 rounded-none border-2 border-foreground bg-background"
          required
        />

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 h-14 rounded-none border-2 border-foreground bg-foreground font-display text-xl uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground"
        >
          <Mail />
          {isPending ? "Enviando..." : "Enviar link"}
        </Button>
      </form>

      {message ? (
        <p className="mt-5 border-2 border-border bg-muted p-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}

      <Button asChild variant="link" className="mt-6 text-sm font-bold">
        <Link href="/login">Voltar para o login</Link>
      </Button>
    </div>
  );
}
