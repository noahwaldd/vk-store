"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Search } from "lucide-react";

import { ProductGrid } from "@/components/ProductGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category, Product } from "@/types/product";

type SortOption = "recent" | "price-asc" | "price-desc";

type ProductCatalogProps = {
  products: Product[];
  categories: Category[];
  initialQuery?: string;
  initialCategory?: string;
};

export function ProductCatalog({
  products,
  categories,
  initialQuery = "",
  initialCategory = "todos",
}: ProductCatalogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortOption>("recent");

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...products]
      .filter((product) => {
        const matchesQuery = normalizedQuery
          ? product.name.toLowerCase().includes(normalizedQuery)
          : true;
        const matchesCategory =
          category === "todos" ? true : product.category?.slug === category;

        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (sort === "price-asc") {
          return a.price - b.price;
        }

        if (sort === "price-desc") {
          return b.price - a.price;
        }

        return 0;
      });
  }, [products, query, category, sort]);

  return (
    <div className="grid gap-6">
      <div data-animate className="grid gap-3 rounded-none border-2 border-foreground bg-background p-4 md:grid-cols-[1fr_220px_220px]">
        <label className="relative">
          <span className="sr-only">Buscar por nome</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome"
            className="pl-9"
          />
        </label>

        <label>
          <span className="sr-only">Filtrar por categoria</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
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
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="focus-ring h-10 w-full rounded-none border-2 border-border bg-background pl-9 pr-3 text-sm shadow-xs"
          >
            <option value="recent">Mais recentes</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} produto{filteredProducts.length === 1 ? "" : "s"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery("");
            setCategory("todos");
            setSort("recent");
          }}
        >
          Limpar filtros
        </Button>
      </div>

      <ProductGrid products={filteredProducts} />
    </div>
  );
}
