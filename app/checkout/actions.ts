"use server";

import { getCurrentUser } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/checkout";
import { findCouponByCode } from "@/lib/coupons";
import { prisma } from "@/lib/db/prisma";
import { buildWhatsAppOrderUrl } from "@/lib/orders/whatsapp";
import { getCouponsSetting } from "@/lib/site-settings";
import { checkoutSchema, type CheckoutFormValues } from "@/schemas/checkout-schema";
import type { CartItem } from "@/types/order";

export type CheckoutActionResult = {
  ok: boolean;
  message: string;
  whatsappUrl?: string | null;
  orderId?: string | null;
};

function cleanOptional(value?: string) {
  return value?.trim() || null;
}

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
    const [coupons, currentUser] = await Promise.all([
      getCouponsSetting(),
      getCurrentUser(),
    ]);

    if (!currentUser) {
      return {
        ok: false,
        message: "Entre na sua conta para finalizar o pedido.",
      };
    }

    const coupon = findCouponByCode(coupons, couponCode);

    if (couponCode && !coupon) {
      return {
        ok: false,
        message: "O cupom informado não está mais disponível.",
      };
    }

    const account = currentUser
      ? await prisma.user.findUnique({
          where: {
            id: currentUser.id,
          },
          select: {
            legal_accepted_at: true,
          },
        })
      : null;
    const hasAcceptedLegal = Boolean(account?.legal_accepted_at);

    if (!hasAcceptedLegal && !parsed.data.acceptPrivacy) {
      return {
        ok: false,
        message: "Aceite a Política de Privacidade para continuar.",
      };
    }

    const userUpdateData = {
      ...(hasAcceptedLegal ? {} : { legal_accepted_at: new Date() }),
      ...(parsed.data.saveCustomerProfile
        ? {
            checkout_name: parsed.data.name,
            checkout_email: parsed.data.email,
            checkout_phone: parsed.data.phone,
            checkout_cep: cleanOptional(parsed.data.cep),
            checkout_address: cleanOptional(parsed.data.address),
            checkout_number: cleanOptional(parsed.data.number),
            checkout_city: cleanOptional(parsed.data.city),
            checkout_state: cleanOptional(parsed.data.state),
          }
        : {}),
    };

    if (currentUser && Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: {
          id: currentUser.id,
        },
        data: userUpdateData,
      });
    }

    const order = await createOrderFromCart({
      items,
      couponCode,
      coupons,
      customer: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
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
