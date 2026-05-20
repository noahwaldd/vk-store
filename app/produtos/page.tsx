import type { Metadata } from "next";

import { ProductCatalog } from "@/components/ProductCatalog";
import { getCategories, getProductsPage, type ProductSort } from "@/lib/products";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Catálogo de roupas, perfumes e acessórios da VK Store.",
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    ordenar?: ProductSort;
    page?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const sort = params.ordenar ?? "recent";
  const category = params.categoria ?? "todos";
  const query = params.q ?? "";
  const [productPage, categories] = await Promise.all([
    getProductsPage({
      page: Number.isInteger(page) ? page : 1,
      limit: 12,
      query,
      category,
      sort,
    }),
    getCategories(),
  ]);

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
        productPage={productPage}
        categories={categories}
        query={query}
        category={category}
        sort={sort}
      />
    </div>
  );
}
