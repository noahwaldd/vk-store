import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, ImageIcon, PackagePlus, ShoppingCart, Type } from "lucide-react";

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
      text: "Mantenha o nome da loja consistente e evite misturar muitos estilos de letra na mesma arte.",
      icon: Type,
    },
    {
      title: "Textos",
      text: "Escreva frases curtas, com preço, tamanho e benefício claros para o cliente entender rápido.",
      icon: Boxes,
    },
    {
      title: "Produto",
      text: "Use fotos bem iluminadas, produto inteiro aparecendo e descrição simples com material, medida e variação.",
      icon: ImageIcon,
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">Painel</h1>
        </div>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <PackagePlus />
            Criar produto
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Produtos ativos", value: activeProducts.length, icon: Boxes },
          { label: "Unidades em estoque", value: stockTotal, icon: ShoppingCart },
          { label: "Produtos removidos", value: products.length - activeProducts.length, icon: Boxes },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-3xl font-black">{item.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="grid gap-4 border border-border bg-background p-4">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Guia visual
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-none sm:text-3xl">
            Dicas simples para manter a loja bonita
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {styleReferences.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="border border-border bg-secondary/55 p-4">
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
