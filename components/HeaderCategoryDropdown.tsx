"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type HeaderCategoryDropdownProps = {
  items: {
    href: string;
    label: string;
  }[];
};

export function HeaderCategoryDropdown({ items }: HeaderCategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        className="focus-ring flex h-12 items-center gap-2 px-4 text-base font-semibold hover:bg-muted xl:px-5 xl:text-lg"
        onClick={() => setOpen((value) => !value)}
      >
        Categorias
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 grid max-h-[min(70vh,28rem)] w-[min(82vw,360px)] gap-1 overflow-y-auto border-2 border-street-lime bg-background p-2 shadow-[8px_8px_0_var(--foreground)]">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring border-2 border-transparent px-3 py-2 text-sm font-bold hover:border-border hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
