"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAccountAction } from "@/app/login/actions";
import { getEmailCorrectionSuggestion } from "@/lib/auth/email-policy";
import { formatBrazilianPhone } from "@/lib/input-format";

type LoginFormProps = {
  title?: string;
  description?: string;
  redirectPath?: string;
};

export function LoginForm({
  title = "Entrar na VK Store",
  description = "Acesse sua conta com e-mail e senha.",
  redirectPath = "/conta",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const displayTitle = mode === "register" ? "Criar conta" : title;
  const displayDescription =
    mode === "register"
      ? "Informe seus dados para comprar e acompanhar seus pedidos."
      : description;
  const emailSuggestion =
    mode === "register" ? getEmailCorrectionSuggestion(email) : null;

  function setPasswordWithoutSpaces(value: string) {
    setPassword(value.replace(/\s/g, ""));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);

    if (mode === "register") {
      const formData = new FormData();
      formData.set("firstName", firstName);
      formData.set("lastName", lastName);
      formData.set("email", email);
      formData.set("phone", phone);
      formData.set("password", password);
      formData.set("privacyAccepted", privacyAccepted ? "on" : "");

      const createResult = await createAccountAction(formData);

      if (!createResult.ok) {
        setIsLoading(false);
        toast.error(createResult.message, {
          id: "auth-submit",
        });
        return;
      }

      toast.success(createResult.message, {
        id: "auth-submit",
      });
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: redirectPath,
    });
    setIsLoading(false);

    if (result?.error) {
      toast.error("E-mail ou senha inválidos.", {
        id: "auth-submit",
      });
      return;
    }

    toast.success("Login realizado com sucesso.", {
      id: "auth-submit",
    });
    window.location.assign(result?.url ?? redirectPath);
  }

  return (
    <div className="w-full">
      <div className="mb-6 border-b-2 border-foreground pb-5">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Conta VK
        </p>
        <h1 className="mt-3 font-graffiti text-5xl leading-[0.9] text-foreground sm:text-6xl">
          {displayTitle}
        </h1>
        {displayDescription ? (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {displayDescription}
          </p>
        ) : null}
      </div>

      <div className="mb-5 grid grid-cols-2 border-2 border-foreground">
        <button
          type="button"
          className={`h-11 font-display uppercase tracking-widest ${
            mode === "login"
              ? "bg-foreground text-background"
              : "bg-background text-foreground"
          }`}
          onClick={() => setMode("login")}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`h-11 border-l-2 border-foreground font-display uppercase tracking-widest ${
            mode === "register"
              ? "bg-foreground text-background"
              : "bg-background text-foreground"
          }`}
          onClick={() => setMode("register")}
        >
          Criar conta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {mode === "register" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="first-name"
              name="firstName"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Nome"
              autoComplete="given-name"
              className="h-12 rounded-none border-2 border-foreground bg-background"
              required
            />
            <Input
              id="last-name"
              name="lastName"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Sobrenome"
              autoComplete="family-name"
              className="h-12 rounded-none border-2 border-foreground bg-background"
              required
            />
          </div>
        ) : null}

        <div className="grid gap-2">
          <Input
            id="email"
            name="email"
            type="text"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
            autoComplete="email"
            className="h-12 rounded-none border-2 border-foreground bg-background"
            required
          />
          {emailSuggestion ? (
            <button
              type="button"
              className="w-fit text-left text-xs font-bold text-foreground underline"
              onClick={() => setEmail(emailSuggestion)}
            >
              Você quis dizer {emailSuggestion}?
            </button>
          ) : null}
        </div>

        {mode === "register" ? (
          <div className="grid gap-2">
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))}
              placeholder="(61) 99999-9999"
              autoComplete="tel"
              maxLength={15}
              className="h-12 rounded-none border-2 border-foreground bg-background"
              required
            />
          </div>
        ) : null}

        <div className="grid gap-2">
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPasswordWithoutSpaces(event.target.value)}
              placeholder={
                mode === "register"
                  ? "Senha com pelo menos 12 caracteres, sem espaços"
                  : "Senha"
              }
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              className="h-12 rounded-none border-2 border-foreground bg-background pr-12"
              required
              minLength={mode === "register" ? 12 : undefined}
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {mode === "login" ? (
            <Link
              href="/esqueci-senha"
              className="w-fit text-xs font-bold text-foreground underline"
            >
              Esqueci minha senha
            </Link>
          ) : null}
        </div>
        {mode === "register" ? (
          <label className="flex items-start gap-3 border-2 border-border bg-muted/40 p-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-primary"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.target.checked)}
              required
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
        ) : null}
        <Button
          type="submit"
          disabled={isLoading}
          className="mt-1 h-[3.25rem] min-h-[3.25rem] rounded-none border-2 border-foreground bg-foreground font-display text-lg uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground sm:h-14 sm:min-h-14 sm:text-xl"
        >
          {isLoading
            ? mode === "register"
              ? "Criando..."
              : "Entrando..."
            : mode === "register"
              ? "Criar conta"
              : "Entrar"}
        </Button>
      </form>

      <div className="mt-4 grid gap-2 text-xs font-bold uppercase text-muted-foreground">
        <span>
          {mode === "login"
            ? "Novo por aqui? Use Criar conta."
            : "Já tem conta? Use Entrar."}
        </span>
      </div>
    </div>
  );
}
