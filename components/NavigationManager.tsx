"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";

import type { NavigationActionResult } from "@/app/admin/navegacao/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NavigationItem, NavigationLocation } from "@/types/navigation";

type NavigationManagerProps = {
  items: NavigationItem[];
  createAction: (formData: FormData) => Promise<NavigationActionResult>;
  updateAction: (id: string, formData: FormData) => Promise<NavigationActionResult>;
  deleteAction: (id: string) => Promise<NavigationActionResult>;
};

const locations: { value: NavigationLocation; label: string }[] = [
  { value: "primary", label: "Menu principal" },
  { value: "secondary", label: "Barra preta" },
  { value: "footer", label: "Rodapé" },
];

function LocationSelect({
  defaultValue,
}: {
  defaultValue?: NavigationLocation;
}) {
  return (
    <select
      name="location"
      defaultValue={defaultValue ?? "primary"}
      className="focus-ring h-10 rounded-none border-2 border-border bg-background px-3 text-sm"
    >
      {locations.map((location) => (
        <option key={location.value} value={location.value}>
          {location.label}
        </option>
      ))}
    </select>
  );
}

export function NavigationManager({
  items,
  createAction,
  updateAction,
  deleteAction,
}: NavigationManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<NavigationActionResult>) {
    startTransition(async () => {
      const result = await action();

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="grid gap-6">
      <form
        action={(formData) => runAction(() => createAction(formData))}
        className="grid gap-4 border-2 border-foreground bg-background p-5"
      >
        <div>
          <h2 className="font-display text-3xl uppercase leading-none">Novo link</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Controle o que aparece em Produtos, Roupas, Perfumes, Acessórios e rodapé.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_180px_120px]">
          <div className="grid gap-2">
            <Label htmlFor="new-nav-label">Texto</Label>
            <Input id="new-nav-label" name="label" placeholder="Produtos" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-nav-href">Destino</Label>
            <Input id="new-nav-href" name="href" placeholder="/produtos" required />
          </div>
          <div className="grid gap-2">
            <Label>Local</Label>
            <LocationSelect />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-nav-position">Ordem</Label>
            <Input id="new-nav-position" name="position" type="number" defaultValue={10} />
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input name="enabled" type="checkbox" defaultChecked className="size-4 accent-primary" />
          Visível no site
        </label>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            <Save />
            Criar link
          </Button>
        </div>
      </form>

      <div className="grid gap-4">
        {items.map((item) => (
          <form
            key={item.id}
            action={(formData) => runAction(() => updateAction(item.id, formData))}
            className="grid gap-4 border-2 border-border bg-background p-5"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_180px_120px_auto] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor={`nav-label-${item.id}`}>Texto</Label>
                <Input
                  id={`nav-label-${item.id}`}
                  name="label"
                  defaultValue={item.label}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`nav-href-${item.id}`}>Destino</Label>
                <Input
                  id={`nav-href-${item.id}`}
                  name="href"
                  defaultValue={item.href}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Local</Label>
                <LocationSelect defaultValue={item.location} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`nav-position-${item.id}`}>Ordem</Label>
                <Input
                  id={`nav-position-${item.id}`}
                  name="position"
                  type="number"
                  defaultValue={item.position}
                />
              </div>
              <Button type="submit" disabled={isPending}>
                <Save />
                Salvar
              </Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  name="enabled"
                  type="checkbox"
                  defaultChecked={item.enabled}
                  className="size-4 accent-primary"
                />
                Visível no site
              </label>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  if (window.confirm(`Remover o link ${item.label}?`)) {
                    runAction(() => deleteAction(item.id));
                  }
                }}
              >
                <Trash2 />
                Remover
              </Button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
