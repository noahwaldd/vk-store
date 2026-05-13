"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export function StorefrontMotion() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    let observer: IntersectionObserver | null = null;
    let timer: number | null = null;

    function startAnimations() {
      timer = window.setTimeout(() => {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        if (prefersReducedMotion) {
          return;
        }

        const elements = gsap.utils.toArray<HTMLElement>("[data-animate]");

        if (!elements.length) {
          return;
        }

        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                return;
              }

              gsap.fromTo(
                entry.target,
                { opacity: 0, y: 24 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.55,
                  ease: "power3.out",
                  immediateRender: false,
                },
              );
              observer?.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
        );

        elements.forEach((element) => observer?.observe(element));
      }, 150);
    }

    if (document.readyState === "complete") {
      startAnimations();
    } else {
      window.addEventListener("load", startAnimations, { once: true });
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }

      window.removeEventListener("load", startAnimations);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
