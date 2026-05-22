"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Category } from "@/types/product";

type CategoryCarouselProps = {
  categories: Category[];
};

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  useEffect(() => {
    updateScrollState();

    window.addEventListener("resize", updateScrollState);

    return () => window.removeEventListener("resize", updateScrollState);
  }, [categories.length]);

  function updateScrollState() {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const maxScrollLeft = track.scrollWidth - track.clientWidth;

    setCanScrollBack(track.scrollLeft > 4);
    setCanScrollForward(track.scrollLeft < maxScrollLeft - 4);
  }

  function scrollCategories(direction: -1 | 1) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.82, 260),
      behavior: "smooth",
    });

    window.setTimeout(updateScrollState, 260);
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateScrollState}
        className="scrollbar-none grid auto-cols-[minmax(220px,85vw)] grid-flow-col gap-3 overflow-x-auto scroll-smooth snap-x pb-1 sm:auto-cols-[calc((100%-0.75rem)/2)] lg:auto-cols-[calc((100%-2.25rem)/4)]"
      >
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/produtos?categoria=${category.slug}`}
            data-animate
            className="group relative flex min-h-[210px] snap-start overflow-hidden border border-border bg-foreground text-background transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--street-lime)]"
          >
            {category.image_url ? (
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw"
                className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,var(--street-lime)_0_18px,var(--street-orange)_18px_36px,var(--asphalt)_36px_62px)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/65 to-foreground/15" />
            <div className="relative mt-auto grid min-h-40 content-end gap-3 p-4">
              <span className="w-fit border-2 border-background bg-street-lime px-2 py-1 text-[11px] font-black uppercase text-foreground">
                Seção {index + 1}
              </span>
              <h3 className="font-display text-2xl uppercase leading-none sm:text-3xl">
                {category.name}
              </h3>
              {category.description ? (
                <p className="line-clamp-2 max-w-sm text-xs font-medium leading-5 text-background/82">
                  {category.description}
                </p>
              ) : null}
              <span className="inline-flex min-h-9 w-fit items-center gap-2 border-2 border-background bg-background px-3 font-display text-base uppercase text-foreground transition-colors group-hover:bg-street-lime">
                Ver produtos
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Ver categorias anteriores"
          disabled={!canScrollBack}
          onClick={() => scrollCategories(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Ver próximas categorias"
          disabled={!canScrollForward}
          onClick={() => scrollCategories(1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
