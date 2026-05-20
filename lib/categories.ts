import { categorySchema, type CategoryPayload } from "@/schemas/category-schema";
import { prisma } from "@/lib/db/prisma";
import { getCategories } from "@/lib/products/queries";
import { uploadCategoryImageToS3 } from "@/lib/storage/s3";
import { slugify } from "@/lib/utils";

function parseCategoryPayload(formData: FormData): CategoryPayload {
  return categorySchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || "",
    description: formData.get("description") || "",
  });
}

function getImageFile(formData: FormData) {
  const image = formData.get("image");

  return image instanceof File && image.size > 0 ? image : null;
}

export { getCategories };

export async function createCategory(formData: FormData) {
  const payload = parseCategoryPayload(formData);
  const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);
  const image = getImageFile(formData);
  const uploadedImage = image ? await uploadCategoryImageToS3(image) : null;
  const categoryCount = await prisma.category.count();

  await prisma.category.create({
    data: {
      name: payload.name,
      slug,
      description: payload.description || null,
      image_url: uploadedImage?.url ?? null,
      image_key: uploadedImage?.key ?? null,
      position: (categoryCount + 1) * 10,
    },
  });
}

export async function updateCategory(id: string, formData: FormData) {
  const payload = parseCategoryPayload(formData);
  const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);
  const image = getImageFile(formData);
  const uploadedImage = image ? await uploadCategoryImageToS3(image) : null;
  const removeImage = formData.get("remove_image") === "on";

  await prisma.category.update({
    where: {
      id,
    },
    data: {
      name: payload.name,
      slug,
      description: payload.description || null,
      ...(uploadedImage
        ? {
            image_url: uploadedImage.url,
            image_key: uploadedImage.key,
          }
        : removeImage
          ? {
              image_url: null,
              image_key: null,
            }
          : {}),
    },
  });
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({
    where: {
      id,
    },
  });
}

export async function reorderCategories(categoryIds: string[]) {
  const uniqueIds = Array.from(new Set(categoryIds)).filter(Boolean);

  if (!uniqueIds.length) {
    return;
  }

  await prisma.$transaction(
    uniqueIds.map((id, index) =>
      prisma.category.update({
        where: {
          id,
        },
        data: {
          position: (index + 1) * 10,
        },
      }),
    ),
  );
}
