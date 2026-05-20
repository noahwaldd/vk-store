import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

export type AuthUser = NonNullable<Session["user"]>;

type UserRole = "user" | "admin";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const DUMMY_PASSWORD_HASH =
  "scrypt$16384$8$1$64$invalid-missing-user-salt$3i6ec3AhXymJbY2QqYdChgJYgsT-pvmoD9hMSbOE6pBmtdb3fIXpzwMMzGN2J3WCgFS4Qf0bGGAWgL3T8Mmknw";

function normalizeEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase();

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

async function registerFailedLogin(userId: string, failedLoginAttempts: number) {
  const nextFailedLoginAttempts = failedLoginAttempts + 1;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failed_login_attempts: { increment: 1 },
      locked_until:
        nextFailedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOGIN_LOCK_MS)
          : null,
    },
  });
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Conta VK",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password_hash: true,
            role: true,
            failed_login_attempts: true,
            locked_until: true,
            disabled_at: true,
          },
        });

        if (!user) {
          await verifyPassword(password, DUMMY_PASSWORD_HASH);
          return null;
        }

        const now = new Date();

        if (user.disabled_at || (user.locked_until && user.locked_until > now)) {
          return null;
        }

        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
          await registerFailedLogin(user.id, user.failed_login_attempts);
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failed_login_attempts: 0,
            locked_until: null,
            last_login_at: now,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role as UserRole;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.role = token.role ?? "user";
      }

      return session;
    },
  },
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  return session?.user ?? null;
}

export function isAdminUser(user: AuthUser | null) {
  return user?.role === "admin";
}

export async function getCurrentAdminUser() {
  const user = await getCurrentUser();

  return isAdminUser(user) ? user : null;
}

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Faça login para acessar o painel administrativo.");
  }

  if (!isAdminUser(user)) {
    throw new Error("Seu usuário não tem permissão para acessar o painel administrativo.");
  }

  return user;
}
