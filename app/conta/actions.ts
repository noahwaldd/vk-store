"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { enforceAccountProfileUpdateRateLimit } from "@/lib/auth/onboarding-guard";
import { prisma } from "@/lib/db/prisma";
import { onlyDigits } from "@/lib/input-format";
import {
  checkoutAddressSchema,
  type CheckoutAddressFormValues,
} from "@/schemas/checkout-profile-schema";

export type AccountCheckoutProfileResult = {
  ok: boolean;
  message: string;
};

function cleanOptional(value?: string) {
  return value?.trim() || null;
}

const accountIdentitySchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo.").max(180),
  phone: z
    .string()
    .transform((value) => onlyDigits(value))
    .refine((value) => value.length >= 10 && value.length <= 11, {
      message: "Informe um telefone com DDD.",
    }),
});

export async function updateAccountIdentityAction(
  values: z.input<typeof accountIdentitySchema>,
): Promise<AccountCheckoutProfileResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      message: "Entre na conta para alterar seus dados.",
    };
  }

  const rateLimit = await enforceAccountProfileUpdateRateLimit(user.id);

  if (!rateLimit.ok) {
    return {
      ok: false,
      message: rateLimit.message ?? "Aguarde um pouco para alterar seus dados novamente.",
    };
  }

  const parsed = accountIdentitySchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revise os dados da conta.",
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
      checkout_phone: parsed.data.phone,
    },
  });

  revalidatePath("/conta");
  revalidatePath("/checkout");

  return {
    ok: true,
    message: "Dados da conta atualizados.",
  };
}

export async function updateCheckoutProfileAction(
  values: CheckoutAddressFormValues,
): Promise<AccountCheckoutProfileResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      message: "Entre na conta para salvar seus dados.",
    };
  }

  const parsed = checkoutAddressSchema.safeParse(values);

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
