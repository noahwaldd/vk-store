import { unstable_noStore as noStore } from "next/cache";

import {
  navigationItemSchema,
  type NavigationItemPayload,
} from "@/schemas/navigation-schema";
import type { NavigationItem, NavigationLocation } from "@/types/navigation";
import { requireSupabaseAdmin, supabase, supabaseAdmin } from "@/lib/supabase";

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
      label: "Checkout",
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

async function getFallbackNavigation(location: NavigationLocation) {
  const baseItems = fallbackNavigation[location];

  if (location === "footer" || !supabase) {
    return baseItems;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error || !data) {
    return baseItems;
  }

  const categoryItems = data.map((category, index) => ({
    id: `fallback-${location}-${category.id}`,
    label: category.name,
    href: `/produtos?categoria=${category.slug}`,
    location,
    position: (index + 2) * 10,
    enabled: true,
  }));

  return location === "primary" ? [...baseItems, ...categoryItems] : categoryItems;
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

  const client = options?.includeDisabled ? (supabaseAdmin ?? supabase) : supabase;

  if (!client) {
    return getFallbackNavigation(location);
  }

  let query = client
    .from("navigation_items")
    .select("*")
    .eq("location", location)
    .order("position", { ascending: true })
    .order("label", { ascending: true });

  if (!options?.includeDisabled) {
    query = query.eq("enabled", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return options?.includeDisabled ? [] : getFallbackNavigation(location);
  }

  return data as NavigationItem[];
}

export async function getAllNavigationItems() {
  noStore();

  const admin = supabaseAdmin ?? supabase;

  if (!admin) {
    return [
      ...fallbackNavigation.primary,
      ...fallbackNavigation.secondary,
      ...fallbackNavigation.footer,
    ];
  }

  const { data, error } = await admin
    .from("navigation_items")
    .select("*")
    .order("location", { ascending: true })
    .order("position", { ascending: true })
    .order("label", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as NavigationItem[];
}

export async function createNavigationItem(formData: FormData) {
  const admin = requireSupabaseAdmin();
  const payload = parseNavigationPayload(formData);

  const { error } = await admin.from("navigation_items").insert({
    ...payload,
    enabled: Boolean(payload.enabled),
  });

  if (error) {
    throw error;
  }
}

export async function updateNavigationItem(id: string, formData: FormData) {
  const admin = requireSupabaseAdmin();
  const payload = parseNavigationPayload(formData);

  const { error } = await admin
    .from("navigation_items")
    .update({
      ...payload,
      enabled: Boolean(payload.enabled),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteNavigationItem(id: string) {
  const admin = requireSupabaseAdmin();

  const { error } = await admin.from("navigation_items").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
