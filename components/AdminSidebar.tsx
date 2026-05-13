import Link from "next/link";
import {
  Boxes,
  LayoutDashboard,
  Navigation,
  PackagePlus,
  Tags,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const adminItems = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Boxes },
  { href: "/admin/produtos/novo", label: "Novo produto", icon: PackagePlus },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/navegacao", label: "Navegacao", icon: Navigation },
];

export function AdminSidebar() {
  return (
    <aside className="rounded-none border-2 border-foreground bg-background p-3 lg:sticky lg:top-28 lg:h-fit">
      <div className="mb-3 px-2 text-xs font-bold uppercase text-muted-foreground">
        Admin
      </div>
      <nav className="grid gap-1">
        {adminItems.map((item) => {
          const Icon = item.icon;

          return (
            <Button key={item.href} asChild variant="ghost" className="justify-start">
              <Link href={item.href}>
                <Icon />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
