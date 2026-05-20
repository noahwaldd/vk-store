"use client";

import { useEffect, useState, type ReactNode } from "react";

export function HeaderFrame({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function updateHeaderState() {
      setScrolled(window.scrollY > 16);
    }

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => window.removeEventListener("scroll", updateHeaderState);
  }, []);

  return (
    <header
      className="site-header sticky top-0 z-40 border-b-4 border-foreground bg-background/95 backdrop-blur"
      data-scrolled={scrolled ? "true" : "false"}
    >
      {children}
    </header>
  );
}
