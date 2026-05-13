import type { Metadata } from "next";

import { ProductCatalog } from "@/components/ProductCatalog";
import { getCategories, getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Catálogo de roupas, perfumes e acessórios da VK Store.",
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase text-primary">Catálogo</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Produtos</h1>
        <p data-animate className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Busque por nome, filtre por categoria e ordene por preço sem sair da página.
        </p>
      </div>

      <ProductCatalog
        products={products}
        categories={categories}
        initialQuery={params.q ?? ""}
        initialCategory={params.categoria ?? "todos"}
      />
    </div>
  );
}
