"use server";

import { checkoutSchema, type CheckoutFormValues } from "@/schemas/checkout-schema";
import {
  createMercadoPagoPreference,
  persistCheckoutOrder,
  resolveCheckoutItems,
} from "@/lib/checkout";
import type { CartItem } from "@/types/order";

export type CheckoutActionResult = {
  ok: boolean;
  message: string;
  redirectUrl?: string | null;
  preferenceId?: string | null;
};

export async function createCheckoutAction(
  values: CheckoutFormValues,
  items: CartItem[],
): Promise<CheckoutActionResult> {
  const parsed = checkoutSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revise os dados do checkout.",
    };
  }

  if (!items.length) {
    return {
      ok: false,
      message: "Adicione ao menos um produto ao carrinho.",
    };
  }

  try {
    const canonicalItems = await resolveCheckoutItems(items);

    const preference = await createMercadoPagoPreference({
      items: canonicalItems,
      customer: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
      },
    });

    await persistCheckoutOrder({
      items: canonicalItems,
      customer: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        document: parsed.data.document,
      },
      preferenceId: preference.id ?? null,
    });

    return {
      ok: true,
      message:
        preference.message ??
        "Pagamento iniciado. Você será redirecionado para concluir a compra.",
      redirectUrl: preference.init_point ?? preference.sandbox_init_point,
      preferenceId: preference.id ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o pagamento.",
    };
  }
}
