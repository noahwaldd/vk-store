import { productSchema, type ProductPayload } from "@/schemas/product-schema";
import { prisma } from "@/lib/db/prisma";
import { uploadProductImageToS3 } from "@/lib/storage/s3";
import { slugify } from "@/lib/utils";
import { normalizeVariationStockByValue } from "@/lib/variation-stock";
import type { ProductVariation } from "@/types/product";

export function parseProductPayload(formData: FormData): ProductPayload {
  const payload = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    compare_at_price: formData.get("compare_at_price") || undefined,
    category_id: formData.get("category_id"),
    stock: formData.get("stock"),
    variations: formData.get("variations") || "",
    variation_label: formData.get("variation_label") || "",
    variation_groups: formData.get("variation_groups") || "",
    featured: formData.get("featured") === "on",
    is_offer: formData.get("is_offer") === "on",
  };

  return productSchema.parse(payload);
}

type ResolvedProductImage = {
  key: string | null;
  url: string;
  alt?: string | null;
};

type PendingProductImageUpload = {
  id: string;
  file: File;
};

type ProductGalleryItem =
  | {
      type: "existing";
      url: string;
      key: string | null;
      alt: string | null;
    }
  | {
      type: "pending";
      id: string;
    };

function getImageFiles(formData: FormData) {
  const files = formData
    .getAll("images")
    .filter((image): image is File => image instanceof File && image.size > 0);
  const imageIds = formData
    .getAll("image_ids")
    .map((imageId) => (typeof imageId === "string" ? imageId : ""));
  const legacyImage = formData.get("image");

  if (legacyImage instanceof File && legacyImage.size > 0) {
    files.push(legacyImage);
    imageIds.push("");
  }

  if (files.length > 8) {
    throw new Error("Envie no máximo 8 fotos por produto.");
  }

  return files.map((file, index): PendingProductImageUpload => ({
    id: imageIds[index] || `pending-${index}`,
    file,
  }));
}

function parseExistingImages(formData: FormData): ResolvedProductImage[] {
  const raw = formData.get("existing_images");

  if (typeof raw !== "string" || !raw) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Galeria de imagens inválida.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Galeria de imagens inválida.");
  }

  return parsed.flatMap((item): ResolvedProductImage[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const image = item as { url?: unknown; key?: unknown; alt?: unknown };

    if (typeof image.url !== "string" || !image.url) {
      return [];
    }

    return [
      {
        url: image.url,
        key: typeof image.key === "string" ? image.key : null,
        alt: typeof image.alt === "string" ? image.alt : null,
      },
    ];
  });
}

function parseGalleryItems(formData: FormData): ProductGalleryItem[] | null {
  const raw = formData.get("gallery_items");

  if (typeof raw !== "string" || !raw) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Galeria de imagens inválida.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Galeria de imagens inválida.");
  }

  return parsed.flatMap((item): ProductGalleryItem[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const image = item as {
      type?: unknown;
      id?: unknown;
      url?: unknown;
      key?: unknown;
      alt?: unknown;
    };

    if (image.type === "pending" && typeof image.id === "string" && image.id) {
      return [
        {
          type: "pending" as const,
          id: image.id,
        },
      ];
    }

    if (image.type === "existing" && typeof image.url === "string" && image.url) {
      return [
        {
          type: "existing" as const,
          url: image.url,
          key: typeof image.key === "string" ? image.key : null,
          alt: typeof image.alt === "string" ? image.alt : null,
        },
      ];
    }

    return [];
  });
}

function normalizeVariationValues(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  const seenValues = new Set<string>();

  return values
    .map((item) => String(item).trim())
    .filter((item) => {
      const key = item.toLocaleLowerCase("pt-BR");

      if (!item || seenValues.has(key)) {
        return false;
      }

      seenValues.add(key);
      return true;
    });
}

function parseVariationGroups(value: string | undefined): ProductVariation[] {
  if (!value?.trim()) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Variações inválidas.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Variações inválidas.");
  }

  const seenLabels = new Set<string>();

  return parsed.flatMap((item): ProductVariation[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const variation = item as {
      label?: unknown;
      values?: unknown;
      stockByValue?: unknown;
    };
    const label = String(variation.label ?? "").trim();
    const values = normalizeVariationValues(variation.values);
    const labelKey = label.toLocaleLowerCase("pt-BR");

    if (!label || !values.length || seenLabels.has(labelKey)) {
      return [];
    }

    seenLabels.add(labelKey);

    const stockByValue = normalizeVariationStockByValue(
      variation.stockByValue,
      values,
    );

    return [
      {
        label,
        values,
        ...(stockByValue ? { stockByValue } : {}),
      },
    ];
  });
}

function toVariationPayload(payload: ProductPayload): ProductVariation[] {
  const groupedVariations = parseVariationGroups(payload.variation_groups);

  if (groupedVariations.length) {
    return groupedVariations;
  }

  const value = payload.variations;
  const label = payload.variation_label;

  if (!value?.trim()) {
    return [];
  }

  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const normalizedLabel = label?.trim() || "Variação";

  return values.length ? [{ label: normalizedLabel, values }] : [];
}

async function resolveProductImages(
  formData: FormData,
  payload: Pick<ProductPayload, "name">,
): Promise<ResolvedProductImage[]> {
  const galleryItems = parseGalleryItems(formData);
  const existingImages = parseExistingImages(formData);
  const imageFiles = getImageFiles(formData);

  if ((galleryItems?.length ?? existingImages.length + imageFiles.length) > 8) {
    throw new Error("Mantenha no máximo 8 fotos por produto.");
  }

  const uploadedImages = imageFiles.length
    ? await Promise.all(
        imageFiles.map(async (imageFile) => ({
          id: imageFile.id,
          image: await uploadProductImageToS3(imageFile.file),
        })),
      )
    : [];
  const uploadedImageById = new Map(
    uploadedImages.flatMap((uploadedImage) =>
      uploadedImage.image
        ? [
            [
              uploadedImage.id,
              {
                key: uploadedImage.image.key,
                url: uploadedImage.image.url,
                alt: payload.name,
              },
            ] satisfies [string, ResolvedProductImage],
          ]
        : [],
    ),
  );

  if (galleryItems) {
    return galleryItems.flatMap((galleryItem) => {
      if (galleryItem.type === "existing") {
        return [
          {
            url: galleryItem.url,
            key: galleryItem.key,
            alt: galleryItem.alt,
          },
        ];
      }

      const uploadedImage = uploadedImageById.get(galleryItem.id);

      return uploadedImage ? [uploadedImage] : [];
    });
  }

  return [
    ...existingImages,
    ...Array.from(uploadedImageById.values()),
  ];
}

export async function createProduct(formData: FormData) {
  const payload = parseProductPayload(formData);
  const images = await resolveProductImages(formData, payload);
  const product = await prisma.product.create({
    data: {
      name: payload.name,
      slug: slugify(payload.name),
      description: payload.description,
      price: payload.price,
      compare_at_price: payload.compare_at_price || null,
      category_id: payload.category_id,
      stock: payload.stock,
      variations: toVariationPayload(payload),
      featured: Boolean(payload.featured),
      is_offer: Boolean(payload.is_offer),
      images: images.length
        ? {
            create: images.map((image, index) => ({
              url: image.url,
              key: image.key,
              alt: image.alt ?? payload.name,
              position: index + 1,
            })),
          }
        : undefined,
    },
    select: {
      id: true,
    },
  });

  return product.id;
}

export async function updateProduct(id: string, formData: FormData) {
  const payload = parseProductPayload(formData);
  const images = await resolveProductImages(formData, payload);

  await prisma.product.update({
    where: {
      id,
    },
    data: {
      name: payload.name,
      slug: slugify(payload.name),
      description: payload.description,
      price: payload.price,
      compare_at_price: payload.compare_at_price || null,
      category_id: payload.category_id,
      stock: payload.stock,
      variations: toVariationPayload(payload),
      featured: Boolean(payload.featured),
      is_offer: Boolean(payload.is_offer),
    },
  });

  if (images.length) {
    await prisma.$transaction([
      prisma.productImage.deleteMany({
        where: {
          product_id: id,
        },
      }),
      prisma.productImage.createMany({
        data: images.map((image, index) => ({
          product_id: id,
          url: image.url,
          key: image.key,
          alt: image.alt ?? payload.name,
          position: index + 1,
        })),
      }),
    ]);
  } else if (formData.has("existing_images") || formData.has("gallery_items")) {
    await prisma.productImage.deleteMany({
      where: {
        product_id: id,
      },
    });
  }
}

export async function softDeleteProduct(id: string) {
  await prisma.product.update({
    where: {
      id,
    },
    data: {
      deleted_at: new Date(),
    },
  });
}

export async function restoreProduct(id: string) {
  await prisma.product.update({
    where: {
      id,
    },
    data: {
      deleted_at: null,
    },
  });
}
