import type { User } from "@supabase/supabase-js";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminUser(user: User | null) {
  if (!user) {
    return false;
  }

  const email = user.email?.toLowerCase();
  const role =
    typeof user.app_metadata?.role === "string"
      ? user.app_metadata.role.toLowerCase()
      : "";
  const roles = Array.isArray(user.app_metadata?.roles)
    ? user.app_metadata.roles.map((item) => String(item).toLowerCase())
    : [];

  return (
    role === "admin" ||
    roles.includes("admin") ||
    Boolean(email && getAdminEmails().has(email))
  );
}

export const getCurrentUser = cache(async () => {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
});

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
