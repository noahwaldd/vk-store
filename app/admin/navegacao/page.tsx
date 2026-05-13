import type { Metadata } from "next";

import {
  createNavigationItemAction,
  deleteNavigationItemAction,
  updateNavigationItemAction,
} from "@/app/admin/navegacao/actions";
import { NavigationManager } from "@/components/NavigationManager";
import { getAllNavigationItems } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Navegacao Admin",
  description: "Gerencie links do menu, barra superior e rodape da loja.",
};

export default async function AdminNavigationPage() {
  const items = await getAllNavigationItems();

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase text-primary">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Navegacao</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Altere os links que aparecem no menu principal, na barra preta e no
          rodape sem editar codigo. Para apontar para uma categoria, use um
          destino como /produtos?categoria=roupas.
        </p>
      </div>

      <NavigationManager
        items={items}
        createAction={createNavigationItemAction}
        updateAction={updateNavigationItemAction}
        deleteAction={deleteNavigationItemAction}
      />
    </div>
  );
}
