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
import { cn } from "@/lib/utils";

const adminGroups = [
  {
    label: "Loja",
    items: [
      { href: "/admin", label: "Painel", icon: LayoutDashboard },
      { href: "/admin/produtos", label: "Produtos", icon: Boxes },
      { href: "/admin/produtos/novo", label: "Novo produto", icon: PackagePlus },
      { href: "/admin/categorias", label: "Categorias", icon: Tags },
    ],
  },
  {
    label: "Operação",
    items: [{ href: "/admin/cupons", label: "Cupons", icon: TicketPercent }],
  },
  {
    label: "Site",
    items: [
      { href: "/admin/navegacao", label: "Navegação", icon: Navigation },
      { href: "/admin/aparencia", label: "Aparência", icon: Palette },
    ],
  },
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
      className="admin-sidebar z-20 h-fit w-full self-start border-2 border-foreground bg-background p-2 shadow-[6px_6px_0_var(--border)] transition-[width] lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:w-[248px] lg:overflow-y-auto lg:data-[collapsed=true]:w-16"
    >
      <div
        className={cn(
          "mb-3 flex items-center justify-between gap-2 border-b border-border/80 px-2 py-2",
          isCollapsed && "lg:justify-center lg:px-0",
        )}
      >
        <div
          className={cn(
            "font-display text-base uppercase tracking-wide text-foreground",
            isCollapsed && "lg:hidden",
          )}
        >
          Painel admin
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "hidden size-8 border border-transparent lg:inline-flex",
            !isCollapsed && "ml-auto",
          )}
          aria-label={isCollapsed ? "Expandir menu admin" : "Minimizar menu admin"}
          onClick={toggleMenu}
        >
          {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
        </Button>
      </div>

      <nav className="grid gap-4">
        {adminGroups.map((group) => (
          <div key={group.label} className="grid gap-1">
            <p
              className={cn(
                "px-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground",
                isCollapsed && "lg:hidden",
              )}
            >
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-3 border border-transparent px-3 text-sm font-black text-muted-foreground transition-colors hover:border-border hover:bg-background/70 hover:text-foreground",
                    active &&
                      "bg-background text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--foreground)_12%,transparent)]",
                    active &&
                      "before:absolute before:left-0 before:top-1.5 before:h-7 before:w-1 before:bg-foreground before:content-['']",
                    isCollapsed && "lg:justify-center lg:gap-0 lg:px-0",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className={isCollapsed ? "lg:hidden" : ""}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
