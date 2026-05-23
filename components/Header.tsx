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
          <div className="container-shell flex min-h-10 items-center justify-center gap-2 py-2 text-center text-xs font-black uppercase sm:text-sm">
            <Megaphone className="size-4 shrink-0" />
            <span>{promoBanner.message}</span>
          </div>
        </div>
      ) : null}
      <div className="site-header-inner container-shell flex min-h-16 items-center gap-2 py-2 sm:min-h-20 sm:gap-3 lg:min-h-28 lg:gap-4 lg:py-4">
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
            className="site-logo-mark size-11 bg-foreground object-contain sm:size-14 lg:size-[72px]"
          />
          <span className="site-logo-text hidden font-graffiti text-4xl tracking-wide md:inline lg:text-5xl">
            VK Store
          </span>
        </Link>

        <form action="/produtos" className="relative hidden flex-1 lg:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Buscar camisetas, perfumes, acessórios..."
            className="site-header-search h-14 pl-12 text-lg"
          />
        </form>

        <nav className="ml-auto hidden min-w-0 max-w-[min(42vw,720px)] items-center gap-1 overflow-visible lg:flex">
          {desktopItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="lg"
              className="shrink-0 px-4 text-base font-semibold xl:px-5 xl:text-lg"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
          {shouldGroupCategories ? <HeaderCategoryDropdown items={categoryItems} /> : null}
        </nav>

        {user ? (
          <div className="hidden items-center gap-3 lg:flex">
            {isAdmin ? (
              <Button asChild variant="ghost" size="lg" className="rounded-none text-lg font-semibold">
                <Link href="/admin">
                  <UserRound className="size-6" />
                  Painel
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="lg" className="rounded-none text-lg font-semibold">
                <Link href="/conta">
                  <UserRound className="size-6" />
                  Conta
                </Link>
              </Button>
            )}
            <SignOutButton />
          </div>
        ) : (
          <Button asChild variant="ghost" size="lg" className="hidden rounded-none text-lg font-semibold lg:inline-flex">
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
