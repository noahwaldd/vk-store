"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import { createCategory, deleteCategory, updateCategory } from "@/lib/categories";

export type CategoryActionResult = {
  ok: boolean;
  message: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a ação.";
}

export async function createCategoryAction(
  formData: FormData,
): Promise<CategoryActionResult> {
  try {
    await requireAdminUser();
    await createCategory(formData);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos/novo");

    return { ok: true, message: "Categoria criada." };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error) };
  }
}

export async function updateCategoryAction(
  id: string,
  formData: FormData,
): Promise<CategoryActionResult> {
  try {
    await requireAdminUser();
    await updateCategory(id, formData);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos");

    return { ok: true, message: "Categoria atualizada." };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error) };
  }
}

export async function deleteCategoryAction(id: string): Promise<CategoryActionResult> {
  try {
    await requireAdminUser();
    await deleteCategory(id);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos");

    return { ok: true, message: "Categoria removida." };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error) };
  }
}
