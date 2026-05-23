"use server";

import { z } from "zod";

import { enforcePasswordResetRateLimit } from "@/lib/auth/onboarding-guard";
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  resetPasswordWithToken,
  sendPasswordResetEmail,
} from "@/lib/auth/password-reset";
import { prisma } from "@/lib/db/prisma";

export type PasswordResetActionResult = {
  ok: boolean;
  message: string;
};

const genericRequestMessage =
  "Se esse e-mail for válido, chegará um link para redefinir a senha na sua caixa de entrada.";

const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
});

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20, "Link inválido."),
    password: z
      .string()
      .min(12, "A senha precisa ter pelo menos 12 caracteres.")
      .max(256, "A senha está muito longa.")
      .refine((value) => !/\s/.test(value), {
        message: "A senha não pode ter espaços.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<PasswordResetActionResult> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Informe um e-mail válido.",
    };
  }

  const rateLimit = await enforcePasswordResetRateLimit(parsed.data.email);

  if (!rateLimit.ok) {
    return {
      ok: false,
      message: rateLimit.message ?? "Aguarde alguns minutos e tente novamente.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      disabled_at: true,
    },
  });

  if (!user || user.disabled_at) {
    return {
      ok: true,
      message: genericRequestMessage,
    };
  }

  try {
    const { token } = await createPasswordResetToken(user.id);
    const resetUrl = buildPasswordResetUrl(token);

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });

    return {
      ok: true,
      message: genericRequestMessage,
    };
  } catch (error) {
    console.error("Password reset email failed", error);

    return {
      ok: true,
      message: genericRequestMessage,
    };
  }
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<PasswordResetActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revise a nova senha.",
    };
  }

  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.password);

    return {
      ok: true,
      message: "Senha redefinida. Você já pode entrar com a nova senha.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir a senha.",
    };
  }
}
