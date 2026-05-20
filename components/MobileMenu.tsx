"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Search, UserRound } from "lucide-react";

import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileMenuProps = {
  items: {
    href: string;
    label: string;
  }[];
  accountHref: string;
  accountLabel: string;
  showSignOut: boolean;
};

export function MobileMenu({
  items,
  accountHref,
  accountLabel,
  showSignOut,
}: MobileMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 lg:hidden"
        aria-label="Abrir menu"
        disabled
      >
        <Menu />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-4">
        <SheetHeader className="pr-12">
          <SheetTitle className="font-graffiti text-4xl leading-none">
            VK Store
          </SheetTitle>
        </SheetHeader>

        <form action="/produtos" className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Buscar produtos"
            className="h-12 pl-10"
          />
        </form>

        <nav className="mt-5 grid gap-2">
          {items.map((item) => (
            <SheetClose key={item.href} asChild>
              <Link
                href={item.href}
                className="focus-ring flex min-h-12 items-center border-2 border-transparent px-3 text-base font-bold hover:border-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="mt-auto grid gap-2 border-t-2 border-border pt-4">
          <SheetClose asChild>
            <Link
              href={accountHref}
              className="focus-ring flex min-h-12 items-center gap-2 border-2 border-foreground px-3 text-base font-black"
            >
              <UserRound className="size-5" />
              {accountLabel}
            </Link>
          </SheetClose>
          {showSignOut ? <SignOutButton /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
