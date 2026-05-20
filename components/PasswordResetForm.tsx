"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { resetPasswordAction } from "@/app/esqueci-senha/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordResetFormProps = {
  token?: string;
};

export function PasswordResetForm({ token }: PasswordResetFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await resetPasswordAction(formData);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setCompleted(true);
      setPassword("");
      setConfirmPassword("");
      toast.success(result.message);
    });
  }

  if (!token) {
    return (
      <div className="w-full">
        <div className="mb-8 border-b-2 border-foreground pb-6">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Recuperação
          </p>
          <h1 className="mt-3 font-graffiti text-6xl leading-[0.9] text-foreground sm:text-7xl">
            Link inválido
          </h1>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Solicite um novo link para redefinir sua senha.
          </p>
        </div>
        <Button asChild>
          <Link href="/esqueci-senha">Solicitar novo link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 border-b-2 border-foreground pb-6">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Segurança
        </p>
        <h1 className="mt-3 font-graffiti text-6xl leading-[0.9] text-foreground sm:text-7xl">
          Nova senha
        </h1>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Crie uma senha com pelo menos 12 caracteres.
        </p>
      </div>

      {completed ? (
        <div className="grid gap-4">
          <p className="border-2 border-border bg-muted p-3 text-sm font-semibold">
            Senha redefinida com sucesso.
          </p>
          <Button asChild>
            <Link href="/login">Entrar na conta</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-5">
          <input type="hidden" name="token" value={token} />

          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nova senha"
              autoComplete="new-password"
              className="h-12 rounded-none border-2 border-foreground bg-background pr-12"
              minLength={12}
              required
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

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirmar nova senha"
            autoComplete="new-password"
            className="h-12 rounded-none border-2 border-foreground bg-background"
            minLength={12}
            required
          />

          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 h-14 rounded-none border-2 border-foreground bg-foreground font-display text-xl uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground"
          >
            <KeyRound />
            {isPending ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
      )}
    </div>
  );
}
