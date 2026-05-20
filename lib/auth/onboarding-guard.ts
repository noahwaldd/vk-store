import "server-only";

import crypto from "node:crypto";

import { headers } from "next/headers";

import { prisma } from "@/lib/db/prisma";

const signupWindows = [
  {
    scope: "signup_ip_15m",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  },
  {
    scope: "signup_ip_day",
    limit: 25,
    windowMs: 24 * 60 * 60 * 1000,
  },
];

const passwordResetWindows = [
  {
    scope: "password_reset_ip_15m",
    limit: 8,
    windowMs: 15 * 60 * 1000,
  },
  {
    scope: "password_reset_email_15m",
    limit: 3,
    windowMs: 15 * 60 * 1000,
  },
  {
    scope: "password_reset_email_day",
    limit: 8,
    windowMs: 24 * 60 * 60 * 1000,
  },
];

const accountProfileWindows = [
  {
    scope: "account_profile_user_hour",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  },
  {
    scope: "account_profile_user_day",
    limit: 12,
    windowMs: 24 * 60 * 60 * 1000,
  },
];

function getSecret() {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "local-dev-secret";
}

function normalizeIp(value: string | null) {
  if (!value) {
    return "unknown";
  }

  const firstIp = value.split(",")[0]?.trim().toLowerCase();

  if (!firstIp) {
    return "unknown";
  }

  if (firstIp.startsWith("[") && firstIp.includes("]")) {
    return firstIp.slice(1, firstIp.indexOf("]"));
  }

  const ipv4WithPort = firstIp.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);

  return ipv4WithPort?.[1] ?? firstIp;
}

async function getClientIpHash() {
  const headerList = await headers();
  const ip = normalizeIp(
    headerList.get("cf-connecting-ip") ??
      headerList.get("true-client-ip") ??
      headerList.get("x-real-ip") ??
      headerList.get("x-forwarded-for"),
  );

  return crypto.createHmac("sha256", getSecret()).update(ip).digest("hex");
}

function hashIdentifier(value: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(value.trim().toLowerCase())
    .digest("hex");
}

function getWindowStart(now: Date, windowMs: number) {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

async function incrementWindow({
  scope,
  identifierHash,
  windowMs,
}: {
  scope: string;
  identifierHash: string;
  windowMs: number;
}) {
  const now = new Date();
  const windowStart = getWindowStart(now, windowMs);
  const resetAt = new Date(windowStart.getTime() + windowMs);
  const id = `${scope}:${identifierHash}:${windowStart.toISOString()}`;

  const entry = await prisma.onboardingRateLimit.upsert({
    where: {
      id,
    },
    create: {
      id,
      scope,
      identifier_hash: identifierHash,
      count: 1,
      reset_at: resetAt,
    },
    update: {
      count: {
        increment: 1,
      },
    },
  });

  return entry.count;
}

export async function enforceSignupRateLimit() {
  const identifierHash = await getClientIpHash();

  for (const window of signupWindows) {
    const count = await incrementWindow({
      scope: window.scope,
      identifierHash,
      windowMs: window.windowMs,
    });

    if (count > window.limit) {
      return {
        ok: false,
        message:
          "Muitas tentativas de cadastro neste acesso. Aguarde alguns minutos e tente novamente.",
      };
    }
  }

  await prisma.onboardingRateLimit.deleteMany({
    where: {
      reset_at: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    ok: true,
  };
}

export async function enforcePasswordResetRateLimit(email: string) {
  const ipHash = await getClientIpHash();
  const emailHash = hashIdentifier(email);

  for (const window of passwordResetWindows) {
    const identifierHash = window.scope.includes("_ip_") ? ipHash : emailHash;
    const count = await incrementWindow({
      scope: window.scope,
      identifierHash,
      windowMs: window.windowMs,
    });

    if (count > window.limit) {
      return {
        ok: false,
        message:
          "Muitas solicitações de recuperação. Aguarde alguns minutos e tente novamente.",
      };
    }
  }

  await prisma.onboardingRateLimit.deleteMany({
    where: {
      reset_at: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    ok: true,
  };
}

export async function enforceAccountProfileUpdateRateLimit(userId: string) {
  const identifierHash = hashIdentifier(userId);

  for (const window of accountProfileWindows) {
    const count = await incrementWindow({
      scope: window.scope,
      identifierHash,
      windowMs: window.windowMs,
    });

    if (count > window.limit) {
      return {
        ok: false,
        message:
          "Muitas alterações de dados na conta. Aguarde um pouco e tente novamente.",
      };
    }
  }

  await prisma.onboardingRateLimit.deleteMany({
    where: {
      reset_at: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  return {
    ok: true,
  };
}
