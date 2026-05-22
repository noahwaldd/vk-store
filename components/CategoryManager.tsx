"use client";

import Image from "next/image";
import { useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Save } from "lucide-react";

import type { CategoryActionResult } from "@/app/admin/categorias/actions";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
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
  reorderAction: (formData: FormData) => Promise<CategoryActionResult>;
};

export function CategoryManager({
  categories,
  createAction,
  updateAction,
  deleteAction,
  reorderAction,
}: CategoryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orderedCategories, setOrderedCategories] = useState(categories);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);

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

  function persistCategoryOrder(nextCategories: Category[]) {
    setOrderedCategories(nextCategories);

    const formData = new FormData();
    formData.set("category_ids", JSON.stringify(nextCategories.map((category) => category.id)));
    runAction(() => reorderAction(formData));
  }

  function moveCategory(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= orderedCategories.length) {
      return;
    }

    const nextCategories = [...orderedCategories];
    const current = nextCategories[index];
    const target = nextCategories[targetIndex];

    if (!current || !target) {
      return;
    }

    nextCategories[index] = target;
    nextCategories[targetIndex] = current;
    persistCategoryOrder(nextCategories);
  }

  function moveCategoryToTarget(targetCategoryId: string) {
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
      return;
    }

    const fromIndex = orderedCategories.findIndex(
      (category) => category.id === draggedCategoryId,
    );
    const toIndex = orderedCategories.findIndex((category) => category.id === targetCategoryId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const nextCategories = [...orderedCategories];
    const [movedCategory] = nextCategories.splice(fromIndex, 1);

    if (!movedCategory) {
      return;
    }

    nextCategories.splice(toIndex, 0, movedCategory);
    persistCategoryOrder(nextCategories);
  }

  function allowDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
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
        <div className="grid gap-2">
          <Label htmlFor="new-category-image">Foto da seção</Label>
          <Input
            id="new-category-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImagePlus className="size-4" />
            Opcional. Recomendado: 1200 x 900 px, até 5MB.
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            <Save />
            Criar categoria
          </Button>
        </div>
      </form>

      <div className="grid gap-4">
        {orderedCategories.map((category, index) => (
          <form
            key={category.id}
            action={(formData) => runAction(() => updateAction(category.id, formData))}
            onDragOver={allowDrop}
            onDrop={(event) => {
              event.preventDefault();
              moveCategoryToTarget(category.id);
              setDraggedCategoryId(null);
            }}
            data-dragging={draggedCategoryId === category.id}
            className="drag-sort-item grid gap-4 border-2 border-border bg-background p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  draggable
                  aria-label={`Arrastar ${category.name}`}
                  className="focus-ring inline-flex h-10 items-center gap-2 border-2 border-border px-3 text-xs font-black uppercase text-muted-foreground hover:border-foreground hover:text-foreground"
                  onDragStart={() => setDraggedCategoryId(category.id)}
                  onDragEnd={() => setDraggedCategoryId(null)}
                >
                  <GripVertical className="size-4" />
                  Ordem {index + 1}
                </button>
                <span className="text-xs font-medium text-muted-foreground">
                  Arraste ou use as setas para mudar a posição.
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Mover categoria para cima"
                  disabled={isPending || index === 0}
                  onClick={() => moveCategory(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Mover categoria para baixo"
                  disabled={isPending || index === orderedCategories.length - 1}
                  onClick={() => moveCategory(index, 1)}
                >
                  <ArrowDown />
                </Button>
              </div>
            </div>
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
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor={`category-image-${category.id}`}>Foto da seção</Label>
                <Input
                  id={`category-image-${category.id}`}
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  {category.image_url
                    ? "Foto atual cadastrada. Envie outra imagem para substituir."
                    : "Sem foto cadastrada. Recomendado: 1200 x 900 px, até 5MB."}
                </p>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    name="remove_image"
                    type="checkbox"
                    className="size-4 accent-primary"
                    disabled={!category.image_url}
                  />
                  Remover foto atual
                </label>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden border-2 border-border bg-muted">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="180px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <ImagePlus />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <ConfirmDeleteButton
                title="Remover categoria?"
                description={`A categoria "${category.name}" será excluída. Os produtos ligados a ela ficarão sem categoria.`}
                disabled={isPending}
                onConfirm={() => runAction(() => deleteAction(category.id))}
              />
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
