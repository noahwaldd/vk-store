import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  ImageIcon,
  Navigation,
  PackagePlus,
  ShoppingCart,
  Tags,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Admin",
  description: "Painel administrativo da VK Store.",
};

export default async function AdminPage() {
  const products = await getProducts({ includeDeleted: true });
  const activeProducts = products.filter((product) => !product.deleted_at);
  const stockTotal = activeProducts.reduce((total, product) => total + product.stock, 0);
  const styleReferences = [
    {
      title: "Marca",
      text: "Use a fonte Badaboom nos lockups grandes e Bebas Neue nos títulos de seção.",
      icon: Type,
    },
    {
      title: "Conteúdo",
      text: "Badaboom / Urban Jungle é o tom principal para marquee, drops e campanhas.",
      icon: Boxes,
    },
    {
      title: "Produto",
      text: "Priorize foto 4:5, fundo limpo, peça visível e descrição curta com material e variação.",
      icon: ImageIcon,
    },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-primary">Admin</p>
          <h1 className="mt-2 text-3xl font-black">Painel</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Login, visão rápida e atalhos para gerenciar produtos.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <PackagePlus />
            Criar produto
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Produtos ativos", value: activeProducts.length, icon: Boxes },
          { label: "Unidades em estoque", value: stockTotal, icon: ShoppingCart },
          { label: "Produtos removidos", value: products.length - activeProducts.length, icon: Boxes },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black">{item.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="grid gap-4 border-2 border-foreground bg-background p-5">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Configuracao da loja
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase leading-none">
            Controle o que aparece no site
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Button asChild variant="outline" className="h-auto justify-start p-4">
            <Link href="/admin/produtos/novo">
              <PackagePlus />
              Novo produto
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start p-4">
            <Link href="/admin/categorias">
              <Tags />
              Categorias
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start p-4">
            <Link href="/admin/navegacao">
              <Navigation />
              Navegacao
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 border-2 border-foreground bg-background p-5">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Guia visual
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase leading-none">
            Referências para manter a loja no padrão
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {styleReferences.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="border-2 border-border bg-secondary p-4">
                <Icon className="size-5" />
                <h3 className="mt-4 font-display text-2xl uppercase leading-none">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
