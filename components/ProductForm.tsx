"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ImagePlus, Plus, Save, Search } from "lucide-react";

import type { ActionResult } from "@/app/admin/produtos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productSchema, type ProductFormValues } from "@/schemas/product-schema";
import type { Category, Product } from "@/types/product";

type ProductFormProps = {
  categories: Category[];
  product?: Product;
  action: (formData: FormData) => Promise<ActionResult>;
};

export function ProductForm({ categories, product, action }: ProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultCategoryId = product?.category_id ?? categories[0]?.id ?? "";
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      compare_at_price: product?.compare_at_price ?? undefined,
      category_id: defaultCategoryId,
      stock: product?.stock ?? 0,
      variations: product?.variations[0]?.values.join(", ") ?? "",
      featured: product?.featured ?? false,
      image_url: product?.images[0]?.url ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;
  const selectedCategoryId = useWatch({
    control: form.control,
    name: "category_id",
  });
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const filteredCategories = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) => {
      const text = `${category.name} ${category.slug} ${category.description ?? ""}`.toLowerCase();

      return text.includes(normalizedQuery);
    });
  }, [categories, categoryQuery]);

  function appendField(formData: FormData, key: keyof ProductFormValues, value: unknown) {
    if (value === undefined || value === null) {
      return;
    }

    formData.append(key, String(value));
  }

  const onSubmit = handleSubmit((values) => {
    const formData = new FormData();
    appendField(formData, "name", values.name);
    appendField(formData, "description", values.description);
    appendField(formData, "price", values.price);
    appendField(formData, "compare_at_price", values.compare_at_price);
    appendField(formData, "category_id", values.category_id);
    appendField(formData, "stock", values.stock);
    appendField(formData, "variations", values.variations);
    appendField(formData, "image_url", values.image_url);

    if (values.featured) {
      formData.append("featured", "on");
    }

    if (imageFile) {
      formData.append("image", imageFile);
    }

    startTransition(async () => {
      const result = await action(formData);

      if (result.ok) {
        toast.success(result.message);
        router.push("/admin/produtos");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  });

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 border-2 border-foreground bg-street-lime p-4 text-foreground">
        <h2 className="font-display text-2xl uppercase leading-none">
          Referência de cadastro
        </h2>
        <div className="grid gap-2 text-sm font-medium leading-6 md:grid-cols-3">
          <p>Use nomes curtos com cara de drop: camiseta boxy, bag cargo, perfume street.</p>
          <p>Fotos verticais 4:5 ou quadradas, fundo limpo e produto bem visível.</p>
          <p>Categoria, variações e preço precisam bater com o que será vendido no checkout.</p>
        </div>
      </section>

      <form
        onSubmit={onSubmit}
        className="grid gap-6 rounded-none border-2 border-foreground bg-background p-5"
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Camiseta, perfume, boné..." {...register("name")} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Descreva material, uso, fragrância, medidas ou detalhes comerciais."
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="price">Preço</Label>
            <Input id="price" type="number" step="0.01" min="0" {...register("price")} />
            {errors.price ? (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="compare_at_price">Preço original</Label>
            <Input
              id="compare_at_price"
              type="number"
              step="0.01"
              min="0"
              {...register("compare_at_price")}
            />
            {errors.compare_at_price ? (
              <p className="text-sm text-destructive">
                {errors.compare_at_price.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="stock">Estoque</Label>
            <Input id="stock" type="number" min="0" {...register("stock")} />
            {errors.stock ? (
              <p className="text-sm text-destructive">{errors.stock.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Label>Categoria</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecionada: {selectedCategory?.name ?? "nenhuma"}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/categorias">
                  <Plus />
                  Gerenciar categorias
                </Link>
              </Button>
            </div>
            <input type="hidden" {...register("category_id")} />
            <label className="relative">
              <span className="sr-only">Buscar categoria</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={categoryQuery}
                onChange={(event) => setCategoryQuery(event.target.value)}
                placeholder="Buscar categoria"
                className="pl-9"
              />
            </label>
            {categories.length === 0 ? (
              <div className="border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">
                Cadastre uma categoria antes de criar produtos.
              </div>
            ) : (
              <div className="grid max-h-64 gap-2 overflow-y-auto border-2 border-border p-2 sm:grid-cols-2">
                {filteredCategories.map((category) => {
                  const selected = category.id === selectedCategoryId;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setValue("category_id", category.id, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className={`border-2 p-3 text-left transition-colors ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:border-foreground"
                      }`}
                    >
                      <span className="block font-display text-xl uppercase leading-none">
                        {category.name}
                      </span>
                      <span className={selected ? "text-background/70" : "text-muted-foreground"}>
                        /{category.slug}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.category_id ? (
              <p className="text-sm text-destructive">{errors.category_id.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2 self-start">
            <Label htmlFor="variations">Variações</Label>
            <Input
              id="variations"
              placeholder="P, M, G ou 50ml, 100ml"
              {...register("variations")}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Separe opções por vírgula. O checkout só aceitará variações cadastradas aqui.
            </p>
            {errors.variations ? (
              <p className="text-sm text-destructive">{errors.variations.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="image">Upload no Supabase Storage</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            />
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImagePlus className="size-4" />
              Requer bucket público configurado em NEXT_PUBLIC_PRODUCT_IMAGES_BUCKET.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image_url">Ou URL da imagem</Label>
            <Input
              id="image_url"
              placeholder="https://..."
              {...register("image_url")}
            />
            {errors.image_url ? (
              <p className="text-sm text-destructive">{errors.image_url.message}</p>
            ) : null}
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-none border-2 border-border bg-muted/40 p-3 text-sm font-medium">
          <input type="checkbox" className="size-4 accent-primary" {...register("featured")} />
          Produto em destaque na home
        </label>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || categories.length === 0}>
            <Save />
            {isPending ? "Salvando..." : "Salvar produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
