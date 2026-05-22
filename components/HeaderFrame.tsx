"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function HeaderFrame({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    function updateHeaderState() {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;

        const scrollY = window.scrollY;
        const nextScrolled = scrolledRef.current
          ? scrollY > 24
          : scrollY > 96;

        if (nextScrolled === scrolledRef.current) {
          return;
        }

        scrolledRef.current = nextScrolled;
        setScrolled(nextScrolled);
      });
    }

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeaderState);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
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
