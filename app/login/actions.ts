"use server";

import { z } from "zod";

import {
  isAllowedRegistrationEmail,
  registrationEmailRejectedMessage,
} from "@/lib/auth/email-policy";
import { enforceSignupRateLimit } from "@/lib/auth/onboarding-guard";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

export type AccountActionResult = {
  ok: boolean;
  message: string;
};

const createAccountSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(80, "O nome está muito longo."),
  lastName: z
    .string()
    .trim()
    .min(2, "Informe seu sobrenome.")
    .max(120, "O sobrenome está muito longo."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido."),
  phone: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length >= 10 && value.length <= 11, {
      message: "Informe um celular com DDD.",
    }),
  password: z
    .string()
    .min(12, "A senha precisa ter pelo menos 12 caracteres.")
    .max(256, "A senha está muito longa."),
  privacyAccepted: z.literal("on", {
    error: "Aceite a Política de Privacidade para criar a conta.",
  }),
});

export async function createAccountAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const parsed = createAccountSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    privacyAccepted: formData.get("privacyAccepted"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  if (!isAllowedRegistrationEmail(parsed.data.email)) {
    return {
      ok: false,
      message: registrationEmailRejectedMessage,
    };
  }

  const rateLimit = await enforceSignupRateLimit();

  if (!rateLimit.ok) {
    return {
      ok: false,
      message:
        rateLimit.message ??
        "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.",
    };
  }

  try {
    const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`;

    await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: fullName,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        phone: parsed.data.phone,
        password_hash: await hashPassword(parsed.data.password),
        role: "user",
      },
    });

    return { ok: true, message: "Conta criada com sucesso." };
  } catch {
    return {
      ok: false,
      message: "Não foi possível criar a conta com esses dados.",
    };
  }
}
