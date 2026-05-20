"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Navigation,
  PackagePlus,
  Palette,
  Tags,
  TicketPercent,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const adminItems = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Boxes },
  { href: "/admin/produtos/novo", label: "Novo produto", icon: PackagePlus },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/cupons", label: "Cupons", icon: TicketPercent },
  { href: "/admin/navegacao", label: "Navegação", icon: Navigation },
  { href: "/admin/aparencia", label: "Aparência", icon: Palette },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsCollapsed(
        window.localStorage.getItem("vkstore-admin-menu") === "collapsed",
      );
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  function toggleMenu() {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        "vkstore-admin-menu",
        next ? "collapsed" : "expanded",
      );

      return next;
    });
  }

  return (
    <aside
      data-collapsed={isCollapsed}
      className="w-full rounded-none border-2 border-foreground bg-background p-3 transition-[width] lg:sticky lg:top-28 lg:h-fit lg:w-[240px] lg:data-[collapsed=true]:w-[76px]"
    >
      <div className="mb-3 flex items-center justify-between gap-2 px-2">
        <div
          className={`text-xs font-bold uppercase text-muted-foreground ${
            isCollapsed ? "lg:hidden" : ""
          }`}
        >
          Admin
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto hidden size-8 lg:inline-flex"
          aria-label={isCollapsed ? "Expandir menu admin" : "Minimizar menu admin"}
          onClick={toggleMenu}
        >
          {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
        </Button>
      </div>
      <nav className="grid gap-1">
        {adminItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Button
              key={item.href}
              asChild
              variant={active ? "default" : "ghost"}
              className={`justify-start ${
                isCollapsed ? "lg:justify-center lg:px-0" : ""
              }`}
            >
              <Link href={item.href} aria-label={item.label} title={item.label}>
                <Icon />
                <span className={isCollapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
