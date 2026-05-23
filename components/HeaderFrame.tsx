"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const COMPACT_AFTER_SCROLL_PX = 120;
const EXPAND_ONLY_NEAR_TOP_PX = 4;

export function HeaderFrame({ children }: { children: ReactNode }) {
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    function updateCompactState() {
      frameRef.current = null;

      const scrollY = window.scrollY;
      const nextCompact = compactRef.current
        ? scrollY > EXPAND_ONLY_NEAR_TOP_PX
        : scrollY > COMPACT_AFTER_SCROLL_PX;

      if (nextCompact === compactRef.current) {
        return;
      }

      compactRef.current = nextCompact;
      setCompact(nextCompact);
    }

    function scheduleUpdate() {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(updateCompactState);
    }

    updateCompactState();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <header
      className="site-header sticky top-0 z-40 border-b-4 border-foreground bg-background/95 backdrop-blur"
      data-compact={compact ? "true" : "false"}
    >
      {children}
    </header>
  );
}
