import { unstable_noStore as noStore } from "next/cache";

import {
  navigationItemSchema,
  type NavigationItemPayload,
} from "@/schemas/navigation-schema";
import { prisma } from "@/lib/db/prisma";
import type { NavigationItem, NavigationLocation } from "@/types/navigation";

const fallbackNavigation: Record<NavigationLocation, NavigationItem[]> = {
  primary: [
    {
      id: "fallback-primary-products",
      label: "Produtos",
      href: "/produtos",
      location: "primary",
      position: 10,
      enabled: true,
    },
  ],
  secondary: [],
  footer: [
    {
      id: "fallback-footer-products",
      label: "Produtos",
      href: "/produtos",
      location: "footer",
      position: 10,
      enabled: true,
    },
    {
      id: "fallback-footer-cart",
      label: "Carrinho",
      href: "/carrinho",
      location: "footer",
      position: 20,
      enabled: true,
    },
    {
      id: "fallback-footer-checkout",
      label: "Finalizar pedido",
      href: "/checkout",
      location: "footer",
      position: 30,
      enabled: true,
    },
    {
      id: "fallback-footer-login",
      label: "Login",
      href: "/login",
      location: "footer",
      position: 40,
      enabled: true,
    },
  ],
};

const requiredNavigationItems: Record<NavigationLocation, NavigationItem[]> = {
  primary: [
    {
      id: "required-primary-products",
      label: "Produtos",
      href: "/produtos",
      location: "primary",
      position: 10,
      enabled: true,
      protected: true,
    },
  ],
  secondary: [],
  footer: [
    {
      id: "required-footer-products",
      label: "Produtos",
      href: "/produtos",
      location: "footer",
      position: 10,
      enabled: true,
      protected: true,
    },
    {
      id: "required-footer-cart",
      label: "Carrinho",
      href: "/carrinho",
      location: "footer",
      position: 20,
      enabled: true,
      protected: true,
    },
    {
      id: "required-footer-checkout",
      label: "Finalizar pedido",
      href: "/checkout",
      location: "footer",
      position: 30,
      enabled: true,
      protected: true,
    },
    {
      id: "required-footer-login",
      label: "Login",
      href: "/login",
      location: "footer",
      position: 40,
      enabled: true,
      protected: true,
    },
  ],
};

const sensitiveHrefs = new Set([
  "/admin",
  "/conta",
  "/login",
  "/produtos",
  "/carrinho",
  "/checkout",
]);

function normalizeNavigationItem(item: {
  id: string;
  label: string;
  href: string;
  location: string;
  position: number;
  enabled: boolean;
  created_at?: Date | null;
  updated_at?: Date | null;
}): NavigationItem {
  return {
    id: item.id,
    label: item.label,
    href: item.href,
    location: item.location as NavigationLocation,
    position: item.position,
    enabled: item.enabled,
    protected: isProtectedNavigationHref(item.href),
    created_at: item.created_at?.toISOString(),
    updated_at: item.updated_at?.toISOString(),
  };
}

function isProtectedNavigationHref(href: string) {
  return sensitiveHrefs.has(href);
}

function withRequiredNavigationItems(
  location: NavigationLocation,
  items: NavigationItem[],
) {
  const merged = [...items];

  requiredNavigationItems[location].forEach((requiredItem) => {
    const existingItem = merged.find((item) => item.href === requiredItem.href);

    if (existingItem) {
      existingItem.protected = true;
      existingItem.enabled = true;
      return;
    }

    merged.push(requiredItem);
  });

  return merged.sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position;
    }

    return left.label.localeCompare(right.label);
  });
}

async function getFallbackNavigation(location: NavigationLocation) {
  const baseItems = fallbackNavigation[location];

  if (location === "footer") {
    return baseItems;
  }

  const categoryItems = await getCategoryNavigationItems(location);

  return location === "primary" ? [...baseItems, ...categoryItems] : categoryItems;
}

async function getCategoryNavigationItems(location: NavigationLocation) {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      position: true,
    },
    orderBy: [{ position: "asc" }, { name: "asc" }, { id: "asc" }],
  });

  return categories.map((category, index) => ({
    id: `fallback-${location}-${category.id}`,
    label: category.name,
    href: `/produtos?categoria=${category.slug}`,
    location,
    position: location === "primary" ? 20 + index * 10 : 10 + index * 10,
    enabled: true,
  }));
}

function mergeByHref(items: NavigationItem[]) {
  const merged = new Map<string, NavigationItem>();

  items.forEach((item) => {
    const existingItem = merged.get(item.href);

    if (!existingItem) {
      merged.set(item.href, item);
      return;
    }

    if (item.id.startsWith(`fallback-${item.location}-`)) {
      merged.set(item.href, {
        ...item,
        protected: existingItem.protected,
      });
      return;
    }

    if (existingItem.protected) {
      merged.set(item.href, {
        ...item,
        protected: true,
        enabled: true,
        position: Math.min(existingItem.position, item.position),
      });
    }
  });

  return Array.from(merged.values());
}

function parseNavigationPayload(formData: FormData): NavigationItemPayload {
  return navigationItemSchema.parse({
    label: formData.get("label"),
    href: formData.get("href"),
    location: formData.get("location"),
    position: formData.get("position"),
    enabled: formData.get("enabled") === "on",
  });
}

export async function getNavigationItems(
  location: NavigationLocation,
  options?: { includeDisabled?: boolean },
): Promise<NavigationItem[]> {
  noStore();

  const items = await prisma.navigationItem.findMany({
    where: {
      location,
      ...(options?.includeDisabled ? {} : { enabled: true }),
    },
    orderBy: [{ position: "asc" }, { label: "asc" }],
  });

  if (!items.length && !options?.includeDisabled) {
    return withRequiredNavigationItems(location, await getFallbackNavigation(location));
  }

  const normalizedItems = items.map(normalizeNavigationItem);

  if (!options?.includeDisabled && (location === "primary" || location === "secondary")) {
    return withRequiredNavigationItems(
      location,
      mergeByHref([...normalizedItems, ...(await getCategoryNavigationItems(location))]),
    );
  }

  return withRequiredNavigationItems(location, normalizedItems);
}

export async function getAllNavigationItems() {
  noStore();

  const items = await prisma.navigationItem.findMany({
    orderBy: [{ location: "asc" }, { position: "asc" }, { label: "asc" }],
  });

  return items
    .map(normalizeNavigationItem)
    .filter((item) => !item.protected);
}

export async function createNavigationItem(formData: FormData) {
  const payload = parseNavigationPayload(formData);

  if (isProtectedNavigationHref(payload.href)) {
    throw new Error("Esse destino é protegido pelo sistema.");
  }

  await prisma.navigationItem.create({
    data: {
      ...payload,
      enabled: Boolean(payload.enabled),
    },
  });
}

export async function updateNavigationItem(id: string, formData: FormData) {
  const payload = parseNavigationPayload(formData);
  const currentItem = await prisma.navigationItem.findUnique({
    where: {
      id,
    },
  });

  if (!currentItem) {
    throw new Error("Link não encontrado.");
  }

  if (
    payload.href !== currentItem.href &&
    isProtectedNavigationHref(payload.href)
  ) {
    throw new Error("Esse destino é protegido pelo sistema.");
  }

  if (isProtectedNavigationHref(currentItem.href)) {
    if (
      payload.href !== currentItem.href ||
      payload.location !== currentItem.location ||
      payload.enabled === false
    ) {
      throw new Error("Links sensíveis não podem ser removidos, ocultados ou redirecionados.");
    }
  }

  await prisma.navigationItem.update({
    where: {
      id,
    },
    data: {
      ...payload,
      enabled: Boolean(payload.enabled),
    },
  });
}

export async function deleteNavigationItem(id: string) {
  const currentItem = await prisma.navigationItem.findUnique({
    where: {
      id,
    },
  });

  if (!currentItem) {
    throw new Error("Link não encontrado.");
  }

  if (isProtectedNavigationHref(currentItem.href)) {
    throw new Error("Links sensíveis não podem ser removidos.");
  }

  await prisma.navigationItem.delete({
    where: {
      id,
    },
  });
}
