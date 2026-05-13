"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginFormProps = {
  title?: string;
  description?: string;
  redirectPath?: string;
};

export function LoginForm({
  title = "Entrar na VK Store",
  description = "Acesse sua conta para acompanhar pedidos e finalizar compras.",
  redirectPath = "/",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let supabase;

    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      toast.error("Configure as variáveis do Supabase para autenticar.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Login realizado com sucesso.");
    window.location.assign(redirectPath);
  }

  return (
    <div className="w-full">
      <div className="mb-8 border-b-2 border-foreground pb-6">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Conta VK
        </p>
        <h1 className="mt-3 font-graffiti text-6xl leading-[0.9] text-foreground sm:text-7xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-2">
          <Input
            id="email"
            type="text"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
            autoComplete="email"
            className="h-12 rounded-none border-2 border-foreground bg-background"
            required
          />
        </div>
        <div className="grid gap-2">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            autoComplete="current-password"
            className="h-12 rounded-none border-2 border-foreground bg-background"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-14 rounded-none border-2 border-foreground bg-foreground font-display text-xl uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-8 text-xs font-bold uppercase text-muted-foreground">
        Dúvidas?{" "}
        <a
          href="https://wa.me/556292338635"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline"
        >
          Fale conosco
        </a>
      </div>
    </div>
  );
}
