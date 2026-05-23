"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, RotateCcw, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { ActionResult } from "@/app/admin/produtos/actions";
import { DeleteProductDialog } from "@/components/DeleteProductDialog";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { Category, Product } from "@/types/product";

type AdminProductsClientProps = {
  products: Product[];
  categories: Category[];
  deleteAction: (id: string) => Promise<ActionResult>;
  restoreAction: (id: string) => Promise<ActionResult>;
};

type StatusFilter = "all" | "active" | "deleted";
type StockFilter = "all" | "available" | "low" | "out";
type FeaturedFilter = "all" | "featured" | "normal";
type OfferFilter = "all" | "offer" | "discount" | "regular";
type SortOption =
  | "created-desc"
  | "name-asc"
  | "price-asc"
  | "price-desc"
  | "stock-asc"
  | "stock-desc";

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AdminProductsClient({
  products,
  categories,
  deleteAction,
  restoreAction,
}: AdminProductsClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [stock, setStock] = useState<StockFilter>("all");
  const [featured, setFeatured] = useState<FeaturedFilter>("all");
  const [offer, setOffer] = useState<OfferFilter>("all");
  const [sort, setSort] = useState<SortOption>("created-desc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const minPriceValue = parseOptionalNumber(minPrice);
    const maxPriceValue = parseOptionalNumber(maxPrice);
    const minStockValue = parseOptionalNumber(minStock);
    const maxStockValue = parseOptionalNumber(maxStock);

    return [...products]
      .filter((product) => {
        const text = `${product.name} ${product.slug} ${product.category?.name ?? ""}`.toLowerCase();
        const matchesQuery = normalizedQuery ? text.includes(normalizedQuery) : true;
        const matchesCategory = categoryId === "all" ? true : product.category_id === categoryId;
        const matchesStatus =
          status === "all" ||
          (status === "active" && !product.deleted_at) ||
          (status === "deleted" && product.deleted_at);
        const matchesStock =
          stock === "all" ||
          (stock === "available" && product.stock > 5) ||
          (stock === "low" && product.stock > 0 && product.stock <= 5) ||
          (stock === "out" && product.stock === 0);
        const hasDiscount = Boolean(
          product.compare_at_price && product.compare_at_price > product.price,
        );
        const isOffer = hasDiscount && product.is_offer;
        const matchesFeatured =
          featured === "all" ||
          (featured === "featured" && product.featured) ||
          (featured === "normal" && !product.featured);
        const matchesOffer =
          offer === "all" ||
          (offer === "offer" && isOffer) ||
          (offer === "discount" && hasDiscount && !isOffer) ||
          (offer === "regular" && !hasDiscount);
        const matchesMinPrice = minPriceValue === null || product.price >= minPriceValue;
        const matchesMaxPrice = maxPriceValue === null || product.price <= maxPriceValue;
        const matchesMinStock = minStockValue === null || product.stock >= minStockValue;
        const matchesMaxStock = maxStockValue === null || product.stock <= maxStockValue;

        return (
          matchesQuery &&
          matchesCategory &&
          matchesStatus &&
          matchesStock &&
          matchesFeatured &&
          matchesOffer &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesMinStock &&
          matchesMaxStock
        );
      })
      .sort((a, b) => {
        if (sort === "name-asc") {
          return a.name.localeCompare(b.name);
        }

        if (sort === "price-asc") {
          return a.price - b.price;
        }

        if (sort === "price-desc") {
          return b.price - a.price;
        }

        if (sort === "stock-asc") {
          return a.stock - b.stock;
        }

        if (sort === "stock-desc") {
          return b.stock - a.stock;
        }

        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      });
  }, [
    categoryId,
    featured,
    offer,
    maxPrice,
    maxStock,
    minPrice,
    minStock,
    products,
    query,
    sort,
    status,
    stock,
  ]);

  const activeCount = products.filter((product) => !product.deleted_at).length;
  const deletedCount = products.length - activeCount;
  const lowStockCount = products.filter(
    (product) => !product.deleted_at && product.stock > 0 && product.stock <= 5,
  ).length;
  const outStockCount = products.filter(
    (product) => !product.deleted_at && product.stock === 0,
  ).length;
  const offerCount = products.filter(
    (product) =>
      !product.deleted_at &&
      product.is_offer &&
      product.compare_at_price &&
      product.compare_at_price > product.price,
  ).length;

  function clearFilters() {
    setQuery("");
    setCategoryId("all");
    setStatus("all");
    setStock("all");
    setFeatured("all");
    setOffer("all");
    setSort("created-desc");
    setMinPrice("");
    setMaxPrice("");
    setMinStock("");
    setMaxStock("");
  }

  function handleRestore(id: string) {
    startTransition(async () => {
      const result = await restoreAction(id);

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-5">
        {[
          { label: "Ativos", value: activeCount },
          { label: "Ofertas", value: offerCount },
          { label: "Removidos", value: deletedCount },
          { label: "Estoque baixo", value: lowStockCount },
          { label: "Sem estoque", value: outStockCount },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-3xl font-black">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="grid gap-4 p-4">
        <div className="flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="size-4" />
          Filtros
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, slug ou categoria"
          />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="focus-ring h-10 rounded-none border-2 border-border bg-background px-3 text-sm shadow-xs"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="focus-ring h-10 rounded-none border-2 border-border bg-background px-3 text-sm shadow-xs"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="deleted">Removidos</option>
          </select>
          <select
            value={stock}
            onChange={(event) => setStock(event.target.value as StockFilter)}
            className="focus-ring h-10 rounded-none border-2 border-border bg-background px-3 text-sm shadow-xs"
          >
            <option value="all">Todo estoque</option>
            <option value="available">Disponível</option>
            <option value="low">Estoque baixo</option>
            <option value="out">Sem estoque</option>
          </select>
          <select
            value={featured}
            onChange={(event) => setFeatured(event.target.value as FeaturedFilter)}
            className="focus-ring h-10 rounded-none border-2 border-border bg-background px-3 text-sm shadow-xs"
          >
            <option value="all">Todos os destaques</option>
            <option value="featured">Em destaque</option>
            <option value="normal">Sem destaque</option>
          </select>
          <select
            value={offer}
            onChange={(event) => setOffer(event.target.value as OfferFilter)}
            className="focus-ring h-10 rounded-none border-2 border-border bg-background px-3 text-sm shadow-xs"
          >
            <option value="all">Ofertas e descontos</option>
            <option value="offer">Só ofertas</option>
            <option value="discount">Desconto comum</option>
            <option value="regular">Sem desconto</option>
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="focus-ring h-10 rounded-none border-2 border-border bg-background px-3 text-sm shadow-xs"
          >
            <option value="created-desc">Mais recentes</option>
            <option value="name-asc">Nome A-Z</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="stock-asc">Menor estoque</option>
            <option value="stock-desc">Maior estoque</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-[11px] font-black uppercase text-muted-foreground">
                Preço min.
              </span>
              <Input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="0"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-black uppercase text-muted-foreground">
                Preço máx.
              </span>
              <Input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="0"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-[11px] font-black uppercase text-muted-foreground">
                Est. min.
              </span>
              <Input
                type="number"
                min="0"
                value={minStock}
                onChange={(event) => setMinStock(event.target.value)}
                placeholder="0"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-black uppercase text-muted-foreground">
                Est. máx.
              </span>
              <Input
                type="number"
                min="0"
                value={maxStock}
                onChange={(event) => setMaxStock(event.target.value)}
                placeholder="0"
              />
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} de {products.length} produto
            {products.length === 1 ? "" : "s"}
          </p>
          <Button type="button" variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      </Card>

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Ajuste os filtros para localizar produtos cadastrados."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-secondary text-left text-xs uppercase text-secondary-foreground">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Estoque</th>
                  <th className="px-4 py-3">Vitrine</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map((product) => {
                  const image = product.images[0]?.url;
                  const hasDiscount = Boolean(
                    product.compare_at_price && product.compare_at_price > product.price,
                  );
                  const isOffer = hasDiscount && product.is_offer;

                  return (
                    <tr key={product.id} className="bg-background">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 overflow-hidden rounded-none bg-muted">
                            {image ? (
                              <Image
                                src={image}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 font-semibold leading-snug">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{product.category?.name ?? "-"}</td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            product.stock === 0
                              ? "secondary"
                              : product.stock <= 5
                                ? "default"
                                : "muted"
                          }
                        >
                          {product.stock}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {isOffer ? <Badge className="offer-badge">Oferta</Badge> : null}
                          {hasDiscount && !isOffer ? (
                            <Badge variant="outline">Desconto</Badge>
                          ) : null}
                          <Badge variant={product.featured ? "default" : "outline"}>
                            {product.featured ? "Destaque" : "Normal"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={product.deleted_at ? "outline" : "muted"}>
                          {product.deleted_at ? "Removido" : "Ativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" aria-label="Editar">
                            <Link href={`/admin/produtos/${product.id}/editar`}>
                              <Edit />
                            </Link>
                          </Button>
                          {product.deleted_at ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Restaurar"
                              disabled={isPending}
                              onClick={() => handleRestore(product.id)}
                            >
                              <RotateCcw />
                            </Button>
                          ) : (
                            <DeleteProductDialog
                              productName={product.name}
                              action={deleteAction.bind(null, product.id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
