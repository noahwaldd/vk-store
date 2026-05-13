import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/product";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (!products.length) {
    return (
      <EmptyState
        title="Nenhum produto encontrado"
        description="Ajuste a busca ou escolha outra categoria para ver mais opções."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
