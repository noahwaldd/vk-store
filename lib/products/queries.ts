import { unstable_noStore as noStore } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Category, Product, ProductVariation } from "@/types/product";

export type ProductSort = "recent" | "price-asc" | "price-desc" | "name-asc";

export type ProductQueryOptions = {
  includeDeleted?: boolean;
  featuredOnly?: boolean;
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
  sort?: ProductSort;
};

export type ProductPage = {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: {
      orderBy: {
        position: "asc";
      };
    };
  };
}>;

function normalizeDate(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeVariations(value: Prisma.JsonValue): ProductVariation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || !("values" in item)) {
        return null;
      }

      const variation = item as { label?: unknown; values?: unknown };

      if (!Array.isArray(variation.values)) {
        return null;
      }

      return {
        label: String(variation.label ?? "Variação"),
        values: variation.values.map((entry) => String(entry)),
      };
    })
    .filter((item): item is ProductVariation => Boolean(item));
}

export function normalizeProduct(row: ProductWithRelations): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    compare_at_price:
      row.compare_at_price === null ? null : Number(row.compare_at_price),
    category_id: row.category_id ?? "",
    category: row.category,
    stock: row.stock,
    variations: normalizeVariations(row.variations),
    images: row.images.map((image) => ({
      id: image.id,
      product_id: image.product_id,
      url: image.url,
      key: image.key,
      alt: image.alt,
      position: image.position,
    })),
    featured: row.featured,
    deleted_at: normalizeDate(row.deleted_at),
    created_at: normalizeDate(row.created_at) ?? undefined,
    updated_at: normalizeDate(row.updated_at) ?? undefined,
  };
}

export async function getCategories(): Promise<Category[]> {
  noStore();

  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }, { id: "asc" }],
  });
}

function buildProductWhere(options: ProductQueryOptions) {
  const and: Prisma.ProductWhereInput[] = [];
  const query = options.query?.trim();

  if (!options.includeDeleted) {
    and.push({ deleted_at: null });
  }

  if (options.featuredOnly) {
    and.push({ featured: true });
  }

  if (query) {
    and.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (options.category && options.category !== "todos") {
    and.push({
      category: {
        slug: options.category,
      },
    });
  }

  return and.length ? { AND: and } : {};
}

function buildProductOrderBy(sort: ProductSort = "recent") {
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];

  if (sort === "price-asc") {
    orderBy.push({ price: "asc" });
  } else if (sort === "price-desc") {
    orderBy.push({ price: "desc" });
  } else if (sort === "name-asc") {
    orderBy.push({ name: "asc" });
  } else {
    orderBy.push({ created_at: "desc" });
  }

  orderBy.push({ id: "asc" });
  return orderBy;
}

export async function getProducts(
  options: ProductQueryOptions = {},
): Promise<Product[]> {
  noStore();

  const limit = options.limit ? Math.min(Math.max(options.limit, 1), 100) : undefined;
  const page = Math.max(options.page ?? 1, 1);

  const products = await prisma.product.findMany({
    where: buildProductWhere(options),
    include: {
      category: true,
      images: {
        orderBy: {
          position: "asc",
        },
      },
    },
    orderBy: buildProductOrderBy(options.sort),
    skip: limit ? (page - 1) * limit : undefined,
    take: limit,
  });

  return products.map(normalizeProduct);
}

export async function getProductsPage(
  options: ProductQueryOptions = {},
): Promise<ProductPage> {
  noStore();

  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 48);
  const where = buildProductWhere(options);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: {
          orderBy: {
            position: "asc",
          },
        },
      },
      orderBy: buildProductOrderBy(options.sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map(normalizeProduct),
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

export async function getFeaturedProducts() {
  return getProducts({ featuredOnly: true, limit: 8 });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  noStore();

  const product = await prisma.product.findFirst({
    where: {
      slug,
      deleted_at: null,
    },
    include: {
      category: true,
      images: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  return product ? normalizeProduct(product) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  noStore();

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
      images: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  return product ? normalizeProduct(product) : null;
}

export async function getRelatedProducts({
  productId,
  categoryId,
  limit = 4,
}: {
  productId: string;
  categoryId?: string | null;
  limit?: number;
}): Promise<Product[]> {
  noStore();

  if (!categoryId) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        not: productId,
      },
      category_id: categoryId,
      deleted_at: null,
    },
    include: {
      category: true,
      images: {
        orderBy: {
          position: "asc",
        },
      },
    },
    orderBy: [
      {
        featured: "desc",
      },
      {
        created_at: "desc",
      },
      {
        id: "asc",
      },
    ],
    take: Math.min(Math.max(limit, 1), 8),
  });

  return products.map(normalizeProduct);
}
