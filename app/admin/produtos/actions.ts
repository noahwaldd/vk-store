"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import {
  createProduct,
  deleteProductPermanently,
  restoreProduct,
  softDeleteProduct,
  updateProduct,
} from "@/lib/products";

export type ActionResult = {
  ok: boolean;
  message: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a ação. Tente novamente.";
}

export async function createProductAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminUser();
    await createProduct(formData);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/admin/produtos");

    return {
      ok: true,
      message: "Produto criado com sucesso.",
    };
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error),
    };
  }
}

export async function updateProductAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminUser();
    await updateProduct(id, formData);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath(`/admin/produtos/${id}/editar`);
    revalidatePath("/admin/produtos");

    return {
      ok: true,
      message: "Produto atualizado com sucesso.",
    };
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error),
    };
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    await requireAdminUser();
    await softDeleteProduct(id);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/admin/produtos");

    return {
      ok: true,
      message: "Produto removido da vitrine.",
    };
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error),
    };
  }
}

export async function restoreProductAction(id: string): Promise<ActionResult> {
  try {
    await requireAdminUser();
    await restoreProduct(id);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/admin/produtos");

    return {
      ok: true,
      message: "Produto restaurado na vitrine.",
    };
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error),
    };
  }
}

export async function permanentDeleteProductAction(id: string): Promise<ActionResult> {
  try {
    await requireAdminUser();
    await deleteProductPermanently(id);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/admin/produtos");

    return {
      ok: true,
      message: "Produto excluído permanentemente.",
    };
  } catch (error) {
    return {
      ok: false,
      message: getErrorMessage(error),
    };
  }
}
