import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateProductAction } from "@/app/admin/produtos/actions";
import { ProductForm } from "@/components/ProductForm";
import { getCategories, getProductById } from "@/lib/products";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Editar produto",
  description: "Edite um produto cadastrado.",
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Editar produto</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atualize informações comerciais, estoque e imagem.
        </p>
      </div>
      <ProductForm
        categories={categories}
        product={product}
        action={updateProductAction.bind(null, product.id)}
      />
    </div>
  );
}
