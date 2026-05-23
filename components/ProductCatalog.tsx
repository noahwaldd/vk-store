"use client";

import Link from "next/link";
import { ArrowDownUp, Search } from "lucide-react";

import { ProductGrid } from "@/components/ProductGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductPage, ProductSort } from "@/lib/products";
import type { Category } from "@/types/product";

type ProductCatalogProps = {
  productPage: ProductPage;
  categories: Category[];
  query?: string;
  category?: string;
  sort?: ProductSort;
  offerOnly?: boolean;
};

function buildPageHref({
  page,
  query,
  category,
  sort,
  offerOnly,
}: {
  page: number;
  query?: string;
  category?: string;
  sort?: ProductSort;
  offerOnly?: boolean;
}) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (category && category !== "todos") {
    params.set("categoria", category);
  }

  if (sort && sort !== "recent") {
    params.set("ordenar", sort);
  }

  if (offerOnly) {
    params.set("oferta", "1");
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return search ? `/produtos?${search}` : "/produtos";
}

export function ProductCatalog({
  productPage,
  categories,
  query = "",
  category = "todos",
  sort = "recent",
  offerOnly = false,
}: ProductCatalogProps) {
  const { products, total, page, totalPages } = productPage;
  const previousPage = Math.max(page - 1, 1);
  const nextPage = Math.min(page + 1, totalPages);
  const categoryLinks = [
    { id: "todos", label: "Todos", slug: "todos" },
    ...categories.map((item) => ({
      id: item.id,
      label: item.name,
      slug: item.slug,
    })),
  ];

  return (
    <div className="grid gap-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categoryLinks.map((item) => {
          const selected = item.slug === category;

          return (
            <Button
              key={item.id}
              asChild
              size="sm"
              variant={selected ? "default" : "outline"}
              className="shrink-0 rounded-none"
            >
              <Link
                href={buildPageHref({
                  page: 1,
                  query,
                  category: item.slug,
                  sort,
                  offerOnly,
                })}
              >
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>

      <form
        action="/produtos"
        data-animate
        className="grid gap-3 rounded-none border-2 border-foreground bg-background p-3 md:grid-cols-[1fr_190px_190px_130px_auto]"
      >
        <label className="relative">
          <span className="sr-only">Buscar por nome</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Buscar por nome"
            className="pl-9"
          />
        </label>

        <label>
          <span className="sr-only">Filtrar por categoria</span>
          <select
            name="categoria"
            defaultValue={category}
            className="focus-ring h-10 w-full rounded-none border-2 border-border bg-background px-3 text-sm shadow-xs"
          >
            <option value="todos">Todas as categorias</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="relative">
          <span className="sr-only">Ordenar produtos</span>
          <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <select
            name="ordenar"
            defaultValue={sort}
            className="focus-ring h-10 w-full rounded-none border-2 border-border bg-background pl-9 pr-3 text-sm shadow-xs"
          >
            <option value="recent">Mais recentes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </label>

        <label className="focus-ring flex h-10 items-center gap-2 rounded-none border-2 border-border bg-background px-3 text-sm font-bold shadow-xs">
          <input
            type="checkbox"
            name="oferta"
            value="1"
            defaultChecked={offerOnly}
            className="size-4 accent-primary"
          />
          Ofertas
        </label>

        <Button type="submit">Aplicar</Button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total} produto{total === 1 ? "" : "s"} encontrados
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/produtos">Limpar filtros</Link>
        </Button>
      </div>

      <ProductGrid products={products} />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t-2 border-foreground pt-4">
          {page <= 1 ? (
            <Button variant="outline" disabled>
              Anterior
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href={buildPageHref({ page: previousPage, query, category, sort, offerOnly })}>
                Anterior
              </Link>
            </Button>
          )}
          <p className="text-sm font-bold text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          {page >= totalPages ? (
            <Button variant="outline" disabled>
              Próxima
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href={buildPageHref({ page: nextPage, query, category, sort, offerOnly })}>
                Próxima
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
