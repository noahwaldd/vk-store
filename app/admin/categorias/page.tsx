import type { Metadata } from "next";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/admin/categorias/actions";
import { CategoryManager } from "@/components/CategoryManager";
import { getCategories } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Categorias Admin",
  description: "Gerencie categorias usadas nos produtos e filtros da loja.",
};

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase text-primary">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Categorias</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Controle as categorias usadas no cadastro, nos filtros e nos links da
          vitrine. Depois de criar uma categoria, use a tela de navegacao para
          escolher se ela aparece no menu.
        </p>
      </div>

      <CategoryManager
        categories={categories}
        createAction={createCategoryAction}
        updateAction={updateCategoryAction}
        deleteAction={deleteCategoryAction}
      />
    </div>
  );
}
