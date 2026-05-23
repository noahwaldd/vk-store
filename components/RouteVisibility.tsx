"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const authRoutePrefixes = ["/login", "/esqueci-senha", "/redefinir-senha"];

export function isAuthRoute(pathname: string | null) {
  return Boolean(
    pathname &&
      authRoutePrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      ),
  );
}

export function HideOnAuthRoutes({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isAuthRoute(pathname)) {
    return null;
  }

  return children;
}
