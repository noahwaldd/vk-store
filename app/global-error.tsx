"use client";

import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="container-shell grid min-h-screen items-center py-12">
          <section className="grid gap-6 border-2 border-foreground bg-background p-6 shadow-[10px_10px_0_var(--street-lime)] sm:p-8">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
              VK STORE
            </p>
            <h1 className="font-graffiti text-6xl leading-none sm:text-8xl">
              Erro inesperado
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Não foi possível carregar a loja agora. Tente novamente para recarregar a experiência.
            </p>
            <div>
              <Button type="button" className="rounded-none" onClick={() => reset()}>
                <RefreshCcw className="size-4" />
                Tentar novamente
              </Button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
