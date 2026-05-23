"use client";

import type { ReactNode } from "react";

export function HeaderFrame({ children }: { children: ReactNode }) {
  return (
    <header className="site-header sticky top-0 z-40 border-b-4 border-foreground bg-background/95 backdrop-blur">
      {children}
    </header>
  );
}
