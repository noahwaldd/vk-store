import Link from "next/link";
import { Home, Search, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="container-shell grid min-h-[70vh] items-center py-12">
      <section className="grid gap-8 border-y-2 border-foreground py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Página não encontrada
          </p>
          <h1 className="mt-4 font-graffiti text-7xl leading-none sm:text-8xl lg:text-9xl">
            404
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Esse caminho saiu da vitrine. Volte para a loja ou procure outro produto.
          </p>
        </div>

        <div className="grid gap-4 border-2 border-foreground bg-street-lime p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center border-2 border-foreground bg-background">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <p className="text-lg font-black">VK STORE</p>
              <p className="text-sm font-semibold text-foreground/70">
                Produtos, ofertas e atendimento pelo WhatsApp.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="rounded-none">
              <Link href="/">
                <Home className="size-4" />
                Início
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-none bg-background">
              <Link href="/produtos">
                <Search className="size-4" />
                Ver produtos
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
