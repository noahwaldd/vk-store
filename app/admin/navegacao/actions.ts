"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import {
  createNavigationItem,
  deleteNavigationItem,
  updateNavigationItem,
} from "@/lib/navigation";

export type NavigationActionResult = {
  ok: boolean;
  message: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a ação.";
}

function revalidateNavigation() {
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/navegacao");
}

export async function createNavigationItemAction(
  formData: FormData,
): Promise<NavigationActionResult> {
  try {
    await requireAdminUser();
    await createNavigationItem(formData);
    revalidateNavigation();

    return { ok: true, message: "Link criado." };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error) };
  }
}

export async function updateNavigationItemAction(
  id: string,
  formData: FormData,
): Promise<NavigationActionResult> {
  try {
    await requireAdminUser();
    await updateNavigationItem(id, formData);
    revalidateNavigation();

    return { ok: true, message: "Link atualizado." };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error) };
  }
}

export async function deleteNavigationItemAction(
  id: string,
): Promise<NavigationActionResult> {
  try {
    await requireAdminUser();
    await deleteNavigationItem(id);
    revalidateNavigation();

    return { ok: true, message: "Link removido." };
  } catch (error) {
    return { ok: false, message: getErrorMessage(error) };
  }
}
