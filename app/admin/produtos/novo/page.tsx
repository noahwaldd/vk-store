import type { Metadata } from "next";

import { createProductAction } from "@/app/admin/produtos/actions";
import { ProductForm } from "@/components/ProductForm";
import { getCategories } from "@/lib/products";

export const metadata: Metadata = {
  title: "Novo produto",
  description: "Cadastre um novo produto.",
};

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Novo produto</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre nome, preço, estoque, variações e imagem.
        </p>
      </div>
      <ProductForm categories={categories} action={createProductAction} />
    </div>
  );
}
