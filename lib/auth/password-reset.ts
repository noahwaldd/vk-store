import "server-only";

import crypto from "node:crypto";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { getSupportEmail, sendTransactionalEmail } from "@/lib/email/smtp";

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

function getSecret() {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "local-dev-secret";
}

function getStoreUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
    "https://lojavkstore.com.br"
  );
}

function hashResetToken(token: string) {
  return crypto.createHmac("sha256", getSecret()).update(token).digest("hex");
}

function createResetToken() {
  const token = crypto.randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPasswordResetUrl(token: string) {
  const url = new URL("/redefinir-senha", getStoreUrl());
  url.searchParams.set("token", token);

  return url.toString();
}

export async function createPasswordResetToken(userId: string) {
  const { token, tokenHash, expiresAt } = createResetToken();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: {
        user_id: userId,
        used_at: null,
      },
      data: {
        used_at: now,
      },
    });

    await tx.passwordResetToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  });

  return {
    token,
    expiresAt,
  };
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name?: string | null;
  resetUrl: string;
}) {
  const displayName = name?.trim() || "cliente";
  const supportEmail = getSupportEmail();
  const subject = "Redefinição de senha - VK Store";
  const text = [
    `Olá, ${displayName}.`,
    "",
    "Recebemos uma solicitação para redefinir sua senha na VK Store.",
    `Acesse o link abaixo para criar uma nova senha. Ele expira em 30 minutos:`,
    resetUrl,
    "",
    "Se você não solicitou essa alteração, ignore este e-mail.",
    "",
    `Suporte: ${supportEmail}`,
  ].join("\n");
  const safeResetUrl = escapeHtml(resetUrl);
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <p>Olá, ${escapeHtml(displayName)}.</p>
      <p>Recebemos uma solicitação para redefinir sua senha na VK Store.</p>
      <p>
        <a href="${safeResetUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;text-decoration:none;font-weight:700;">
          Redefinir senha
        </a>
      </p>
      <p>O link expira em 30 minutos. Se você não solicitou essa alteração, ignore este e-mail.</p>
      <p>Suporte: <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a></p>
    </div>
  `;

  await sendTransactionalEmail({
    to: email,
    subject,
    text,
    html,
  });
}

export async function resetPasswordWithToken(token: string, password: string) {
  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      token_hash: tokenHash,
      used_at: null,
      expires_at: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      user_id: true,
    },
  });

  if (!resetToken) {
    throw new Error("Link inválido ou expirado. Solicite uma nova recuperação de senha.");
  }

  const now = new Date();
  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: resetToken.user_id,
      },
      data: {
        password_hash: passwordHash,
        failed_login_attempts: 0,
        locked_until: null,
      },
    });

    await tx.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        used_at: now,
      },
    });

    await tx.passwordResetToken.updateMany({
      where: {
        user_id: resetToken.user_id,
        used_at: null,
      },
      data: {
        used_at: now,
      },
    });
  });
}
