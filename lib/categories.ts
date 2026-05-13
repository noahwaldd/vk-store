import { categorySchema, type CategoryPayload } from "@/schemas/category-schema";
import { getCategories } from "@/lib/products";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

function parseCategoryPayload(formData: FormData): CategoryPayload {
  return categorySchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || "",
    description: formData.get("description") || "",
  });
}

export { getCategories };

export async function createCategory(formData: FormData) {
  const admin = requireSupabaseAdmin();
  const payload = parseCategoryPayload(formData);
  const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

  const { error } = await admin.from("categories").insert({
    name: payload.name,
    slug,
    description: payload.description || null,
  });

  if (error) {
    throw error;
  }
}

export async function updateCategory(id: string, formData: FormData) {
  const admin = requireSupabaseAdmin();
  const payload = parseCategoryPayload(formData);
  const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

  const { error } = await admin
    .from("categories")
    .update({
      name: payload.name,
      slug,
      description: payload.description || null,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteCategory(id: string) {
  const admin = requireSupabaseAdmin();

  const { error } = await admin.from("categories").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
