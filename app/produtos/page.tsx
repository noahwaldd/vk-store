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
    oferta?: string;
    page?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const sortOptions: ProductSort[] = ["recent", "price-asc", "price-desc", "name-asc"];
  const sort = sortOptions.includes(params.ordenar as ProductSort)
    ? (params.ordenar as ProductSort)
    : "recent";
  const category = params.categoria ?? "todos";
  const query = params.q ?? "";
  const offerOnly = params.oferta === "1" || params.oferta === "true";
  const [productPage, categories] = await Promise.all([
    getProductsPage({
      page: Number.isInteger(page) ? page : 1,
      limit: 12,
      query,
      category,
      sort,
      offerOnly,
    }),
    getCategories(),
  ]);

  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase text-primary">Catálogo</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          {offerOnly ? "Ofertas" : "Produtos"}
        </h1>
        <p data-animate className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {offerOnly
            ? "Produtos marcados como oferta especial pela loja."
            : "Busque por nome, filtre por categoria e ordene por preço sem sair da página."}
        </p>
      </div>

      <ProductCatalog
        productPage={productPage}
        categories={categories}
        query={query}
        category={category}
        sort={sort}
        offerOnly={offerOnly}
      />
    </div>
  );
}
