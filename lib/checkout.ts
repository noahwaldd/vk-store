import { Preference } from "mercadopago";
import { MercadoPagoConfig } from "mercadopago";

import type { CartItem } from "@/types/order";
import { getCartTotal } from "@/lib/cart";
import { supabase, supabaseAdmin } from "@/lib/supabase";

type CheckoutProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  stock: number;
  variations?: unknown;
  deleted_at?: string | null;
  product_images?: CartItem["product"]["images"] | null;
  images?: CartItem["product"]["images"] | null;
};

const checkoutProductSelect = `
  id,
  name,
  slug,
  price,
  stock,
  variations,
  deleted_at,
  product_images(id, product_id, url, alt, position)
`;

function normalizeRequestedQuantity(quantity: unknown) {
  const value = Number(quantity);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Quantidade inválida no carrinho.");
  }

  return value;
}

function getAllowedVariations(row: CheckoutProductRow) {
  if (!Array.isArray(row.variations)) {
    return [];
  }

  return row.variations.flatMap((variation) => {
    if (
      variation &&
      typeof variation === "object" &&
      "values" in variation &&
      Array.isArray(variation.values)
    ) {
      return variation.values.map((value: unknown) => String(value));
    }

    return [];
  });
}

export async function resolveCheckoutItems(items: CartItem[]) {
  const client = supabaseAdmin ?? supabase;

  if (!client) {
    throw new Error("Supabase não configurado.");
  }

  const requestedItems = items
    .map((item) => ({
      productId: String(item.product?.id ?? ""),
      quantity: normalizeRequestedQuantity(item.quantity),
      variation: item.variation?.trim() || undefined,
    }))
    .filter((item) => item.productId);

  if (!requestedItems.length) {
    throw new Error("Adicione ao menos um produto ao carrinho.");
  }

  const productIds = [...new Set(requestedItems.map((item) => item.productId))];
  const { data, error } = await client
    .from("products")
    .select(checkoutProductSelect)
    .in("id", productIds)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  const products = new Map(
    ((data ?? []) as CheckoutProductRow[]).map((product) => [product.id, product]),
  );
  const groupedItems = new Map<string, CartItem>();

  for (const requested of requestedItems) {
    const product = products.get(requested.productId);

    if (!product) {
      throw new Error("Um produto do carrinho não está mais disponível.");
    }

    if (product.stock <= 0) {
      throw new Error(`${product.name} está sem estoque.`);
    }

    const allowedVariations = getAllowedVariations(product);

    if (allowedVariations.length > 0 && !requested.variation) {
      throw new Error(`Selecione uma variação para ${product.name}.`);
    }

    if (
      requested.variation &&
      allowedVariations.length > 0 &&
      !allowedVariations.includes(requested.variation)
    ) {
      throw new Error(`A variação escolhida para ${product.name} não está disponível.`);
    }

    const key = `${product.id}:${requested.variation ?? "default"}`;
    const existing = groupedItems.get(key);
    const nextQuantity = (existing?.quantity ?? 0) + requested.quantity;

    if (nextQuantity > product.stock) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }

    groupedItems.set(key, {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        stock: product.stock,
        images: [...(product.product_images ?? product.images ?? [])].sort(
          (a, b) => a.position - b.position,
        ),
      },
      quantity: nextQuantity,
      variation: requested.variation,
    });
  }

  return [...groupedItems.values()];
}

export async function createMercadoPagoPreference({
  items,
  customer,
}: {
  items: CartItem[];
  customer: { name: string; email: string; phone: string };
}) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const successUrl =
    process.env.NEXT_PUBLIC_CHECKOUT_SUCCESS_URL ??
    `${siteUrl}/checkout?status=success`;
  const failureUrl =
    process.env.NEXT_PUBLIC_CHECKOUT_FAILURE_URL ??
    `${siteUrl}/checkout?status=failure`;
  const pendingUrl =
    process.env.NEXT_PUBLIC_CHECKOUT_PENDING_URL ??
    `${siteUrl}/checkout?status=pending`;

  const response = await preference.create({
    body: {
      items: items.map((item) => ({
        id: item.product.id,
        title: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        currency_id: "BRL",
      })),
      payer: {
        name: customer.name,
        email: customer.email,
        phone: {
          number: customer.phone,
        },
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: "approved",
    },
  });

  return {
    id: response.id,
    init_point: response.init_point,
    sandbox_init_point: response.sandbox_init_point,
    total: getCartTotal(items),
    message: null,
  };
}

export async function persistCheckoutOrder({
  items,
  customer,
  preferenceId,
}: {
  items: CartItem[];
  customer: { name: string; email: string; phone: string; document?: string };
  preferenceId?: string | null;
}) {
  if (!supabaseAdmin) {
    return null;
  }

  const { data: customerData, error: customerError } = await supabaseAdmin
    .from("customers")
    .insert({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      document: customer.document || null,
    })
    .select("id")
    .single();

  if (customerError) {
    throw customerError;
  }

  const { data: orderData, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_id: customerData.id,
      status: "pending",
      total: getCartTotal(items),
      mercado_pago_preference_id: preferenceId,
    })
    .select("id")
    .single();

  if (orderError) {
    throw orderError;
  }

  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
    items.map((item) => ({
      order_id: orderData.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
      variation: item.variation ?? null,
    })),
  );

  if (itemsError) {
    throw itemsError;
  }

  return orderData.id as string;
}
