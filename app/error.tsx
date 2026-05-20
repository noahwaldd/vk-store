"use client";

import Link from "next/link";
import { Home, RefreshCcw, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-shell grid min-h-[70vh] items-center py-12">
      <section className="grid gap-8 border-y-2 border-foreground py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Algo saiu do lugar
          </p>
          <h1 className="mt-4 font-graffiti text-6xl leading-none sm:text-7xl lg:text-8xl">
            Erro na vitrine
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            A página não carregou como deveria. Tente novamente ou volte para a loja.
          </p>
        </div>

        <div className="grid gap-4 border-2 border-foreground bg-background p-5 shadow-[8px_8px_0_var(--street-lime)] sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center border-2 border-foreground bg-street-lime">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <p className="text-lg font-black">Ação disponível</p>
              <p className="text-sm text-muted-foreground">
                Recarregue esta tela sem perder o caminho atual.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="rounded-none" onClick={() => reset()}>
              <RefreshCcw className="size-4" />
              Tentar de novo
            </Button>
            <Button asChild variant="outline" className="rounded-none">
              <Link href="/">
                <Home className="size-4" />
                Ir para o início
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
