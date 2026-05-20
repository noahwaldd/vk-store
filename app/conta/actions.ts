"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
  checkoutProfileSchema,
  type CheckoutProfileFormValues,
} from "@/schemas/checkout-profile-schema";

export type AccountCheckoutProfileResult = {
  ok: boolean;
  message: string;
};

function cleanOptional(value?: string) {
  return value?.trim() || null;
}

export async function updateCheckoutProfileAction(
  values: CheckoutProfileFormValues,
): Promise<AccountCheckoutProfileResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      message: "Entre na conta para salvar seus dados.",
    };
  }

  const parsed = checkoutProfileSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revise os dados do checkout.",
    };
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      checkout_name: parsed.data.name,
      checkout_email: parsed.data.email,
      checkout_phone: parsed.data.phone,
      checkout_cep: cleanOptional(parsed.data.cep),
      checkout_address: cleanOptional(parsed.data.address),
      checkout_number: cleanOptional(parsed.data.number),
      checkout_city: cleanOptional(parsed.data.city),
      checkout_state: cleanOptional(parsed.data.state),
    },
  });

  revalidatePath("/conta");
  revalidatePath("/checkout");

  return {
    ok: true,
    message: "Dados salvos para os próximos pedidos.",
  };
}
