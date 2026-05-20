"use server";

import { checkoutSchema, type CheckoutFormValues } from "@/schemas/checkout-schema";
import { createOrderFromCart } from "@/lib/checkout";
import { findCouponByCode } from "@/lib/coupons";
import { buildWhatsAppOrderUrl } from "@/lib/orders/whatsapp";
import { getCouponsSetting } from "@/lib/site-settings";
import type { CartItem } from "@/types/order";

export type CheckoutActionResult = {
  ok: boolean;
  message: string;
  whatsappUrl?: string | null;
  orderId?: string | null;
};

export async function createCheckoutAction(
  values: CheckoutFormValues,
  items: CartItem[],
  couponCode?: string | null,
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
    const coupons = await getCouponsSetting();
    const coupon = findCouponByCode(coupons, couponCode);

    if (couponCode && !coupon) {
      return {
        ok: false,
        message: "O cupom informado não está mais disponível.",
      };
    }

    const order = await createOrderFromCart({
      items,
      couponCode,
      coupons,
      customer: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        document: parsed.data.document,
      },
    });

    const whatsappUrl = buildWhatsAppOrderUrl({
      orderId: order.orderId,
      items: order.items,
      total: order.total,
      couponCode: order.coupon?.coupon.code,
      couponDiscount: order.coupon?.discount,
      customer: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        document: parsed.data.document,
      },
      delivery: {
        cep: parsed.data.cep,
        address: parsed.data.address,
        number: parsed.data.number,
        city: parsed.data.city,
        state: parsed.data.state,
      },
    });

    return {
      ok: true,
      message: "Pedido criado. Vamos abrir o WhatsApp para finalizar.",
      whatsappUrl,
      orderId: order.orderId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível finalizar o pedido.",
    };
  }
}
