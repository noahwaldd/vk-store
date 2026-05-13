import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Search, UserRound } from "lucide-react";

import { CartDrawer } from "@/components/CartDrawer";
import { MobileMenu } from "@/components/MobileMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOutAction() {
  "use server";

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function Header() {
  const [user, primaryItems, secondaryItems] = await Promise.all([
    getCurrentUser(),
    getNavigationItems("primary"),
    getNavigationItems("secondary"),
  ]);
  const isAdmin = isAdminUser(user);
  const mobileItems = [...primaryItems, ...secondaryItems].filter(
    (item, index, items) => items.findIndex((entry) => entry.href === item.href) === index,
  );

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background/95 backdrop-blur">
      <div className="container-shell flex min-h-16 items-center gap-3 py-3">
        <MobileMenu items={mobileItems} />

        <Link href="/" className="flex min-w-fit items-center gap-2">
          <Image
            src="/vk-store-white.png"
            alt="VK Store"
            width={40}
            height={40}
            className="bg-foreground object-contain"
            style={{ width: "40px", height: "40px" }}
          />
          <span className="hidden font-graffiti text-3xl tracking-wide sm:inline">
            VK Store
          </span>
        </Link>

        <form action="/produtos" className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Buscar camisetas, perfumes, acessórios..."
            className="pl-9"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {primaryItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        {user ? (
          <div className="hidden items-center gap-2 sm:flex">
            {isAdmin ? (
              <Button asChild variant="ghost" size="sm" className="rounded-none">
                <Link href="/admin">
                  <UserRound />
                  Painel
                </Link>
              </Button>
            ) : (
              <span className="inline-flex h-9 items-center gap-2 px-3 text-sm font-black">
                <UserRound className="size-4" />
                Conta
              </span>
            )}
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="rounded-none">
                <LogOut />
                Sair
              </Button>
            </form>
          </div>
        ) : (
          <Button asChild variant="ghost" size="sm" className="hidden rounded-none sm:inline-flex">
            <Link href="/login">
              <UserRound />
              Entrar
            </Link>
          </Button>
        )}
        <CartDrawer />
      </div>

      <div className="hidden border-t-2 border-foreground bg-foreground lg:block">
        <div className="container-shell flex items-center gap-8 py-3 font-display text-lg uppercase tracking-widest text-background">
          {secondaryItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={index === secondaryItems.length - 1 ? "ml-auto hover:text-muted" : "hover:text-muted"}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
