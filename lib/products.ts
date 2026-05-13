import { unstable_noStore as noStore } from "next/cache";

import { productSchema, type ProductPayload } from "@/schemas/product-schema";
import type { Category, Product, ProductImage, ProductVariation } from "@/types/product";
import {
  productImagesBucket,
  requireSupabaseAdmin,
  supabase,
  supabaseAdmin,
} from "@/lib/supabase";
import { slugify } from "@/lib/utils";

type ProductRow = Omit<Product, "category" | "images"> & {
  category?: Category | null;
  categories?: Category | null;
  images?: ProductImage[] | null;
  product_images?: ProductImage[] | null;
};

const productSelect = `
  *,
  category:categories(*),
  images:product_images(*)
`;

function normalizeProduct(row: ProductRow): Product {
  return {
    ...row,
    price: Number(row.price),
    compare_at_price:
      row.compare_at_price === null || row.compare_at_price === undefined
        ? null
        : Number(row.compare_at_price),
    category: row.category ?? row.categories ?? null,
    images: [...(row.images ?? row.product_images ?? [])].sort(
      (a, b) => a.position - b.position,
    ),
    variations: Array.isArray(row.variations)
      ? (row.variations as ProductVariation[])
      : [],
  };
}

export async function getCategories(): Promise<Category[]> {
  noStore();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getProducts(options?: {
  includeDeleted?: boolean;
  featuredOnly?: boolean;
}): Promise<Product[]> {
  noStore();

  const client = options?.includeDeleted ? (supabaseAdmin ?? supabase) : supabase;

  if (!client) {
    return [];
  }

  let query = client.from("products").select(productSelect).order("created_at", {
    ascending: false,
  });

  if (!options?.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  if (options?.featuredOnly) {
    query = query.eq("featured", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as ProductRow[]).map(normalizeProduct);
}

export async function getFeaturedProducts() {
  return getProducts({ featuredOnly: true });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  noStore();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return null;
  }

  return normalizeProduct(data as ProductRow);
}

export async function getProductById(id: string): Promise<Product | null> {
  noStore();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return normalizeProduct(data as ProductRow);
}

export function parseProductPayload(formData: FormData): ProductPayload {
  const payload = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    compare_at_price: formData.get("compare_at_price") || undefined,
    category_id: formData.get("category_id"),
    stock: formData.get("stock"),
    variations: formData.get("variations") || "",
    featured: formData.get("featured") === "on",
    image_url: formData.get("image_url") || "",
  };

  return productSchema.parse(payload);
}

export async function uploadProductImage(file: File) {
  const admin = requireSupabaseAdmin();

  if (!file.size) {
    return null;
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const filename = `products/${crypto.randomUUID()}.${extension}`;

  const { error } = await admin.storage.from(productImagesBucket).upload(filename, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = admin.storage.from(productImagesBucket).getPublicUrl(filename);
  return data.publicUrl;
}

function getImageFile(formData: FormData) {
  const image = formData.get("image");

  return image instanceof File ? image : null;
}

function toVariationPayload(value: string | undefined): ProductVariation[] {
  if (!value?.trim()) {
    return [];
  }

  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length ? [{ label: "Variação", values }] : [];
}

export async function createProduct(formData: FormData) {
  const admin = requireSupabaseAdmin();
  const payload = parseProductPayload(formData);
  const imageFile = getImageFile(formData);
  const uploadedUrl = imageFile ? await uploadProductImage(imageFile) : null;
  const imageUrl = uploadedUrl ?? payload.image_url;
  const slug = slugify(payload.name);

  const { data, error } = await admin
    .from("products")
    .insert({
      name: payload.name,
      slug,
      description: payload.description,
      price: payload.price,
      compare_at_price: payload.compare_at_price || null,
      category_id: payload.category_id,
      stock: payload.stock,
      variations: toVariationPayload(payload.variations),
      featured: Boolean(payload.featured),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  if (imageUrl) {
    await admin.from("product_images").insert({
      product_id: data.id,
      url: imageUrl,
      alt: payload.name,
      position: 1,
    });
  }

  return data.id as string;
}

export async function updateProduct(id: string, formData: FormData) {
  const admin = requireSupabaseAdmin();
  const payload = parseProductPayload(formData);
  const imageFile = getImageFile(formData);
  const uploadedUrl = imageFile ? await uploadProductImage(imageFile) : null;
  const imageUrl = uploadedUrl ?? payload.image_url;

  const { error } = await admin
    .from("products")
    .update({
      name: payload.name,
      slug: slugify(payload.name),
      description: payload.description,
      price: payload.price,
      compare_at_price: payload.compare_at_price || null,
      category_id: payload.category_id,
      stock: payload.stock,
      variations: toVariationPayload(payload.variations),
      featured: Boolean(payload.featured),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  if (imageUrl) {
    await admin
      .from("product_images")
      .upsert(
        {
          product_id: id,
          url: imageUrl,
          alt: payload.name,
          position: 1,
        },
        { onConflict: "product_id,position" },
      );
  }
}

export async function softDeleteProduct(id: string) {
  const admin = requireSupabaseAdmin();

  const { error } = await admin
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function restoreProduct(id: string) {
  const admin = requireSupabaseAdmin();

  const { error } = await admin
    .from("products")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
}
