import { productSchema, type ProductPayload } from "@/schemas/product-schema";
import { prisma } from "@/lib/db/prisma";
import { uploadProductImageToS3 } from "@/lib/storage/s3";
import { slugify } from "@/lib/utils";
import { normalizeVariationStockByValue } from "@/lib/variation-stock";
import type { ProductVariation } from "@/types/product";

export class ProductNameError extends Error {
  field = "name" as const;

  constructor(message: string) {
    super(message);
    this.name = "ProductNameError";
  }
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
    variation_label: formData.get("variation_label") || "",
    variation_groups: formData.get("variation_groups") || "",
    featured: formData.get("featured") === "on",
    is_offer: formData.get("is_offer") === "on",
  };

  return productSchema.parse(payload);
}

type ResolvedProductImage = {
  sourceId?: string | null;
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
      id?: string | null;
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

    const image = item as { id?: unknown; url?: unknown; key?: unknown; alt?: unknown };

    if (typeof image.url !== "string" || !image.url) {
      return [];
    }

    return [
      {
        sourceId: typeof image.id === "string" ? image.id : null,
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
          id: typeof image.id === "string" ? image.id : null,
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

function normalizeVariationKey(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function buildProductSlug(name: string) {
  const slug = slugify(name);

  if (!slug) {
    throw new ProductNameError(
      "Informe um nome com letras ou números para gerar uma URL válida.",
    );
  }

  return slug;
}

function getProductNameConflictMessage(conflict: {
  name: string;
  deleted_at: Date | null;
}) {
  if (conflict.deleted_at) {
    return `Já existe um produto removido chamado "${conflict.name}". Restaure esse produto ou exclua-o permanentemente antes de usar esse nome.`;
  }

  return `Já existe um produto ativo chamado "${conflict.name}". Use um nome mais específico, com cor, modelo, material, coleção ou volume.`;
}

async function assertUniqueProductSlug(slug: string, currentProductId?: string) {
  const conflict = await prisma.product.findFirst({
    where: {
      slug,
      ...(currentProductId
        ? {
            id: {
              not: currentProductId,
            },
          }
        : {}),
    },
    select: {
      name: true,
      deleted_at: true,
    },
  });

  if (conflict) {
    throw new ProductNameError(getProductNameConflictMessage(conflict));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProductSlugUniqueConstraintError(error: unknown) {
  if (!isRecord(error) || error.code !== "P2002") {
    return false;
  }

  const meta = isRecord(error.meta) ? error.meta : {};
  const target = meta.target;

  if (Array.isArray(target)) {
    return target.includes("slug");
  }

  return typeof target === "string" && target.includes("slug");
}

function normalizeProductWriteError(error: unknown) {
  if (isProductSlugUniqueConstraintError(error)) {
    return new ProductNameError(
      "Já existe um produto usando esse nome. Use um nome mais específico para diferenciar o item.",
    );
  }

  return error;
}

function isDirectImageUrl(value: string) {
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

function buildImageUrlByReference(images: ResolvedProductImage[]) {
  const imageUrlByReference = new Map<string, string>();

  images.forEach((image) => {
    if (image.sourceId) {
      imageUrlByReference.set(image.sourceId, image.url);
    }

    if (image.key) {
      imageUrlByReference.set(image.key, image.url);
    }

    imageUrlByReference.set(image.url, image.url);
  });

  return imageUrlByReference;
}

function normalizeVariationImageByValue(
  imageByValue: unknown,
  values: string[],
  imageUrlByReference: Map<string, string>,
) {
  if (!imageByValue || typeof imageByValue !== "object") {
    return undefined;
  }

  const entries = Object.entries(imageByValue as Record<string, unknown>);
  const imageRefByNormalizedValue = new Map(
    entries.map(([value, imageRef]) => [
      normalizeVariationKey(value),
      typeof imageRef === "string" ? imageRef.trim() : "",
    ]),
  );
  const normalizedImageByValue: Record<string, string> = {};

  values.forEach((value) => {
    const imageRef = imageRefByNormalizedValue.get(normalizeVariationKey(value));

    if (!imageRef) {
      return;
    }

    const imageUrl = imageUrlByReference.get(imageRef) ?? (isDirectImageUrl(imageRef) ? imageRef : "");

    if (imageUrl) {
      normalizedImageByValue[value] = imageUrl;
    }
  });

  return Object.keys(normalizedImageByValue).length ? normalizedImageByValue : undefined;
}

function parseVariationGroups(
  value: string | undefined,
  imageUrlByReference = new Map<string, string>(),
): ProductVariation[] {
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
      imageByValue?: unknown;
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
    const imageByValue = normalizeVariationImageByValue(
      variation.imageByValue,
      values,
      imageUrlByReference,
    );

    return [
      {
        label,
        values,
        ...(stockByValue ? { stockByValue } : {}),
        ...(imageByValue ? { imageByValue } : {}),
      },
    ];
  });
}

function toVariationPayload(
  payload: ProductPayload,
  images: ResolvedProductImage[] = [],
): ProductVariation[] {
  const groupedVariations = parseVariationGroups(
    payload.variation_groups,
    buildImageUrlByReference(images),
  );

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
                sourceId: uploadedImage.id,
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
            sourceId: galleryItem.id,
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
  const slug = buildProductSlug(payload.name);

  await assertUniqueProductSlug(slug);

  const images = await resolveProductImages(formData, payload);
  const variations = toVariationPayload(payload, images);

  try {
    const product = await prisma.product.create({
      data: {
        name: payload.name,
        slug,
        description: payload.description,
        price: payload.price,
        compare_at_price: payload.compare_at_price || null,
        category_id: payload.category_id,
        stock: payload.stock,
        variations,
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
  } catch (error) {
    throw normalizeProductWriteError(error);
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const payload = parseProductPayload(formData);
  const slug = buildProductSlug(payload.name);

  await assertUniqueProductSlug(slug, id);

  const images = await resolveProductImages(formData, payload);
  const variations = toVariationPayload(payload, images);

  try {
    await prisma.product.update({
      where: {
        id,
      },
      data: {
        name: payload.name,
        slug,
        description: payload.description,
        price: payload.price,
        compare_at_price: payload.compare_at_price || null,
        category_id: payload.category_id,
        stock: payload.stock,
        variations,
        featured: Boolean(payload.featured),
        is_offer: Boolean(payload.is_offer),
      },
    });
  } catch (error) {
    throw normalizeProductWriteError(error);
  }

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

export async function deleteProductPermanently(id: string) {
  await prisma.product.delete({
    where: {
      id,
    },
  });
}
