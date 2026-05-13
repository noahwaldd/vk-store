"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";

import type { CategoryActionResult } from "@/app/admin/categorias/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/types/product";

type CategoryManagerProps = {
  categories: Category[];
  createAction: (formData: FormData) => Promise<CategoryActionResult>;
  updateAction: (id: string, formData: FormData) => Promise<CategoryActionResult>;
  deleteAction: (id: string) => Promise<CategoryActionResult>;
};

export function CategoryManager({
  categories,
  createAction,
  updateAction,
  deleteAction,
}: CategoryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<CategoryActionResult>) {
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
          <h2 className="font-display text-3xl uppercase leading-none">
            Nova categoria
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use categorias para organizar produtos e alimentar filtros da loja.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="grid gap-2">
            <Label htmlFor="new-category-name">Nome</Label>
            <Input id="new-category-name" name="name" placeholder="Roupas" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-category-slug">Slug opcional</Label>
            <Input id="new-category-slug" name="slug" placeholder="roupas" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-category-description">Descrição</Label>
          <Textarea
            id="new-category-description"
            name="description"
            placeholder="Texto curto para cards e filtros."
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            <Save />
            Criar categoria
          </Button>
        </div>
      </form>

      <div className="grid gap-4">
        {categories.map((category) => (
          <form
            key={category.id}
            action={(formData) => runAction(() => updateAction(category.id, formData))}
            className="grid gap-4 border-2 border-border bg-background p-5"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor={`category-name-${category.id}`}>Nome</Label>
                <Input
                  id={`category-name-${category.id}`}
                  name="name"
                  defaultValue={category.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`category-slug-${category.id}`}>Slug</Label>
                <Input
                  id={`category-slug-${category.id}`}
                  name="slug"
                  defaultValue={category.slug}
                />
              </div>
              <Button type="submit" disabled={isPending}>
                <Save />
                Salvar
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`category-description-${category.id}`}>Descrição</Label>
              <Textarea
                id={`category-description-${category.id}`}
                name="description"
                defaultValue={category.description ?? ""}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  if (window.confirm(`Remover a categoria ${category.name}?`)) {
                    runAction(() => deleteAction(category.id));
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
