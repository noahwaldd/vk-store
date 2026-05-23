import Image from "next/image";
import Link from "next/link";
import { Megaphone, Search, UserRound } from "lucide-react";

import { CartDrawer } from "@/components/CartDrawer";
import { HeaderCategoryDropdown } from "@/components/HeaderCategoryDropdown";
import { HeaderFrame } from "@/components/HeaderFrame";
import { MobileMenu } from "@/components/MobileMenu";
import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import { getCouponsSetting, getPromoBannerSetting } from "@/lib/site-settings";

export async function Header() {
  const [user, primaryItems, promoBanner, coupons] = await Promise.all([
    getCurrentUser(),
    getNavigationItems("primary"),
    getPromoBannerSetting(),
    getCouponsSetting(),
  ]);
  const isAdmin = isAdminUser(user);
  const mobileItems = primaryItems.filter(
    (item, index, items) => items.findIndex((entry) => entry.href === item.href) === index,
  );
  const categoryItems = primaryItems.filter((item) =>
    item.href.startsWith("/produtos?categoria="),
  );
  const shouldGroupCategories = categoryItems.length > 3;
  const desktopItems = shouldGroupCategories
    ? primaryItems.filter((item) => !item.href.startsWith("/produtos?categoria="))
    : primaryItems;
  const accountHref = user ? (isAdmin ? "/admin" : "/conta") : "/login?next=/conta";
  const accountLabel = user ? (isAdmin ? "Painel" : "Conta") : "Entrar";

  return (
    <HeaderFrame>
      {promoBanner.enabled ? (
        <div className="site-promo border-b-2 border-foreground bg-street-lime text-foreground">
          <div className="container-shell flex min-h-8 items-center justify-center gap-2 py-1.5 text-center text-[11px] font-black uppercase sm:text-xs">
            <Megaphone className="size-3.5 shrink-0" />
            <span>{promoBanner.message}</span>
          </div>
        </div>
      ) : null}
      <div className="site-header-inner container-shell flex min-h-14 items-center gap-2 py-1.5 sm:min-h-16 sm:gap-3 lg:min-h-20 lg:gap-3 lg:py-2">
        <MobileMenu
          items={mobileItems}
          accountHref={accountHref}
          accountLabel={accountLabel}
          showSignOut={Boolean(user)}
        />

        <Link href="/" className="flex min-w-fit items-center gap-2 sm:gap-3 lg:gap-4">
          <Image
            src="/vk-store-white.png"
            alt="VK Store"
            width={72}
            height={72}
            className="site-logo-mark size-10 bg-foreground object-contain sm:size-12 lg:size-14"
          />
          <span className="site-logo-text hidden font-graffiti text-3xl tracking-wide md:inline lg:text-4xl">
            VK Store
          </span>
        </Link>

        <form action="/produtos" className="relative hidden flex-1 lg:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Buscar camisetas, perfumes, acessórios..."
            className="site-header-search h-11 pl-11 text-sm"
          />
        </form>

        <nav className="ml-auto hidden min-w-0 max-w-[min(44vw,760px)] items-center gap-1 overflow-visible lg:flex">
          {desktopItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className="h-10 shrink-0 px-3 text-sm font-semibold xl:px-4 xl:text-base"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
          {shouldGroupCategories ? <HeaderCategoryDropdown items={categoryItems} /> : null}
        </nav>

        {user ? (
          <div className="hidden items-center gap-3 lg:flex">
            {isAdmin ? (
              <Button asChild variant="ghost" className="rounded-none text-sm font-semibold xl:text-base">
                <Link href="/admin">
                  <UserRound className="size-6" />
                  Painel
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" className="rounded-none text-sm font-semibold xl:text-base">
                <Link href="/conta">
                  <UserRound className="size-6" />
                  Conta
                </Link>
              </Button>
            )}
            <SignOutButton />
          </div>
        ) : (
          <Button asChild variant="ghost" className="hidden rounded-none text-sm font-semibold lg:inline-flex xl:text-base">
            <Link href="/login?next=/conta">
              <UserRound className="size-6" />
              Entrar
            </Link>
          </Button>
        )}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="ml-auto h-9 px-2 text-xs font-black lg:hidden"
        >
          <Link href={accountHref}>
            <UserRound className="size-4" />
            {accountLabel}
          </Link>
        </Button>
        <CartDrawer coupons={coupons} />
      </div>
    </HeaderFrame>
  );
}
