import type { Metadata } from "next";
import Link from "next/link";
import { PackagePlus } from "lucide-react";

import {
  deleteProductAction,
  permanentDeleteProductAction,
  restoreProductAction,
} from "@/app/admin/produtos/actions";
import { AdminProductsClient } from "@/components/AdminProductsClient";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Produtos Admin",
  description: "Gerencie produtos, estoque e imagens.",
};

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts({ includeDeleted: true }),
    getCategories(),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">Produtos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Liste, edite, remova da vitrine e acompanhe o estoque.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <PackagePlus />
            Novo produto
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto cadastrado"
          description="Crie o primeiro produto para começar a montar a vitrine."
        >
          <Button asChild>
            <Link href="/admin/produtos/novo">Criar produto</Link>
          </Button>
        </EmptyState>
      ) : (
        <AdminProductsClient
          products={products}
          categories={categories}
          deleteAction={deleteProductAction}
          permanentDeleteAction={permanentDeleteProductAction}
          restoreAction={restoreProductAction}
        />
      )}
    </div>
  );
}
