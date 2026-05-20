"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Footprints,
  GripVertical,
  ImagePlus,
  PackageCheck,
  PackageX,
  Plus,
  Ruler,
  Save,
  Search,
  Shirt,
  Trash2,
} from "lucide-react";

import type { ActionResult } from "@/app/admin/produtos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productSchema, type ProductFormValues } from "@/schemas/product-schema";
import type { Category, Product, ProductImage } from "@/types/product";

type ProductFormProps = {
  categories: Category[];
  product?: Product;
  action: (formData: FormData) => Promise<ActionResult>;
};

type ExistingGalleryImage = Pick<ProductImage, "id" | "url" | "key" | "alt" | "position"> & {
  kind: "existing";
};

type PendingGalleryImage = {
  kind: "pending";
  id: string;
  file: File;
  previewUrl: string;
  alt: string;
  position: number;
};

type ManagedGalleryImage = ExistingGalleryImage | PendingGalleryImage;

const sizePresets = [
  {
    id: "clothing",
    label: "Roupas",
    description: "PP ao XG",
    icon: Shirt,
    variationLabel: "Tamanho",
    values: ["PP", "P", "M", "G", "GG", "XG"],
  },
  {
    id: "shoes",
    label: "Calçados",
    description: "33 ao 44",
    icon: Footprints,
    variationLabel: "Numeração",
    values: ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
  },
  {
    id: "custom",
    label: "Manual",
    description: "Você define",
    icon: Ruler,
    variationLabel: "Variação",
    values: [],
  },
] as const;

type CompactSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function formatPriceInput(value?: number | null) {
  return value === undefined || value === null
    ? ""
    : value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

function normalizeGalleryPositions(images: ManagedGalleryImage[]) {
  return images.map((image, index) => ({
    ...image,
    position: index + 1,
  }));
}

function createPendingImageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `pending-${crypto.randomUUID()}`;
  }

  return `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getGallerySignature(images: ManagedGalleryImage[]) {
  return JSON.stringify(
    images.map((image) =>
      image.kind === "existing" ? `existing:${image.id}` : `pending:${image.id}`,
    ),
  );
}

function CompactSection({
  title,
  description,
  defaultOpen = true,
  children,
}: CompactSectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-none border-2 border-border bg-background"
    >
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-sm font-black uppercase">{title}</span>
          {description ? (
            <span className="mt-1 block text-xs font-medium text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-4 border-t-2 border-border p-4">{children}</div>
    </details>
  );
}

function buildInitialGallery(product?: Product): ManagedGalleryImage[] {
  return (
    product?.images.map((image, index) => ({
      kind: "existing" as const,
      id: image.id,
      url: image.url,
      key: image.key,
      alt: image.alt,
      position: index + 1,
    })) ?? []
  );
}

export function ProductForm({ categories, product, action }: ProductFormProps) {
  const initialGallery = useMemo(() => buildInitialGallery(product), [product]);
  const initialGallerySignature = useMemo(
    () => getGallerySignature(initialGallery),
    [initialGallery],
  );
  const [galleryImages, setGalleryImages] = useState<ManagedGalleryImage[]>(initialGallery);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [hasStockEnabled, setHasStockEnabled] = useState(
    product ? product.stock > 0 : true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const defaultCategoryId = product?.category_id ?? categories[0]?.id ?? "";
  const firstVariation = product?.variations[0];
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: formatPriceInput(product?.price),
      compare_at_price: formatPriceInput(product?.compare_at_price),
      category_id: defaultCategoryId,
      stock: product?.stock ?? 1,
      variations: firstVariation?.values.join(", ") ?? "",
      variation_label: firstVariation?.label ?? "Tamanho",
      featured: product?.featured ?? false,
    },
  });

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;

    return () => {
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrls.clear();
    };
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = form;
  const selectedCategoryId = useWatch({
    control: form.control,
    name: "category_id",
  });
  const selectedStock = useWatch({
    control: form.control,
    name: "stock",
  });
  const variationValues = useWatch({
    control: form.control,
    name: "variations",
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
  const galleryDirty = getGallerySignature(galleryImages) !== initialGallerySignature;
  const hasChanges = isDirty || galleryDirty;
  const stockNumber = Number(selectedStock) || 0;
  const variationCount = String(variationValues ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;

  function appendField(formData: FormData, key: keyof ProductFormValues, value: unknown) {
    if (value === undefined || value === null) {
      return;
    }

    formData.append(key, String(value));
  }

  function addImageFiles(files?: FileList | null) {
    const selectedFiles = Array.from(files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    const availableSlots = Math.max(8 - galleryImages.length, 0);

    if (!availableSlots) {
      toast.error("Remova uma foto antes de adicionar outra. O limite é de 8 fotos.");
      return;
    }

    const acceptedFiles = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      toast.error("A galeria aceita no máximo 8 fotos por produto.");
    }

    const pendingImages = acceptedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);

      return {
        kind: "pending" as const,
        id: createPendingImageId(),
        file,
        previewUrl,
        alt: file.name,
        position: 1,
      };
    });

    setGalleryImages((images) => normalizeGalleryPositions([...images, ...pendingImages]));
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= galleryImages.length) {
      return;
    }

    setGalleryImages((images) => {
      const nextImages = [...images];
      const current = nextImages[index];
      const target = nextImages[targetIndex];

      if (!current || !target) {
        return images;
      }

      nextImages[index] = target;
      nextImages[targetIndex] = current;

      return normalizeGalleryPositions(nextImages);
    });
  }

  function moveGalleryImageToTarget(targetImageId: string) {
    if (!draggedImageId || draggedImageId === targetImageId) {
      return;
    }

    setGalleryImages((images) => {
      const fromIndex = images.findIndex((image) => image.id === draggedImageId);
      const toIndex = images.findIndex((image) => image.id === targetImageId);

      if (fromIndex < 0 || toIndex < 0) {
        return images;
      }

      const nextImages = [...images];
      const [movedImage] = nextImages.splice(fromIndex, 1);

      if (!movedImage) {
        return images;
      }

      nextImages.splice(toIndex, 0, movedImage);

      return normalizeGalleryPositions(nextImages);
    });
  }

  function allowImageDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
  }

  function removeGalleryImage(imageId: string) {
    setGalleryImages((images) => {
      const removedImage = images.find((image) => image.id === imageId);

      if (removedImage?.kind === "pending") {
        URL.revokeObjectURL(removedImage.previewUrl);
        previewUrlsRef.current.delete(removedImage.previewUrl);
      }

      return normalizeGalleryPositions(images.filter((image) => image.id !== imageId));
    });
  }

  function applySizePreset(preset: (typeof sizePresets)[number]) {
    setValue("variation_label", preset.variationLabel, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (preset.values.length) {
      setValue("variations", preset.values.join(", "), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function setStockAvailability(enabled: boolean) {
    setHasStockEnabled(enabled);
    setValue("stock", enabled ? Math.max(stockNumber, 1) : 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!hasChanges || isSubmitting) {
      return;
    }

    const formData = new FormData();
    appendField(formData, "name", values.name);
    appendField(formData, "description", values.description);
    appendField(formData, "price", values.price);
    appendField(formData, "compare_at_price", values.compare_at_price);
    appendField(formData, "category_id", values.category_id);
    appendField(formData, "stock", values.stock);
    appendField(formData, "variations", values.variations);
    appendField(formData, "variation_label", values.variation_label);
    formData.append(
      "gallery_items",
      JSON.stringify(
        galleryImages.map((image, index) =>
          image.kind === "existing"
            ? {
                type: "existing",
                id: image.id,
                url: image.url,
                key: image.key,
                alt: image.alt,
                position: index + 1,
              }
            : {
                type: "pending",
                id: image.id,
                position: index + 1,
              },
        ),
      ),
    );

    if (values.featured) {
      formData.append("featured", "on");
    }

    galleryImages.forEach((image) => {
      if (image.kind === "pending") {
        formData.append("image_ids", image.id);
        formData.append("images", image.file, image.file.name);
      }
    });

    setIsSubmitting(true);

    try {
      const result = await action(formData);

      if (result.ok) {
        toast.success(result.message);
        router.push("/admin/produtos");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o produto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 border-2 border-foreground bg-street-lime p-4 text-foreground">
        <h2 className="font-display text-2xl uppercase leading-none">
          Guia simples de cadastro
        </h2>
        <div className="grid gap-2 text-sm font-medium leading-6 md:grid-cols-3">
          <p>Use um nome que o cliente reconheça rápido, como Camiseta preta ou Perfume 100ml.</p>
          <p>Envie foto clara, com o produto inteiro aparecendo e sem muita coisa no fundo.</p>
          <p>Confira preço, estoque, categoria e tamanhos antes de salvar.</p>
        </div>
      </section>

      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-none border-2 border-foreground bg-background p-3 sm:p-4"
      >
        <CompactSection
          title="Dados do produto"
          description="Nome e descrição ficam visíveis na vitrine."
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

        </CompactSection>

        <CompactSection
          title="Preço e estoque"
          description="Defina valores e se o produto está disponível para compra."
        >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="price">Preço</Label>
            <Input
              id="price"
              type="text"
              inputMode="decimal"
              placeholder="R$ 129,90"
              autoComplete="off"
              {...register("price")}
            />
            {errors.price ? (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="compare_at_price">Preço original</Label>
            <Input
              id="compare_at_price"
              type="text"
              inputMode="decimal"
              placeholder="R$ 159,90"
              autoComplete="off"
              {...register("compare_at_price")}
            />
            {errors.compare_at_price ? (
              <p className="text-sm text-destructive">
                {errors.compare_at_price.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Disponibilidade</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={hasStockEnabled ? "default" : "outline"}
                className="justify-start px-3"
                onClick={() => setStockAvailability(true)}
              >
                <PackageCheck />
                Tem estoque
              </Button>
              <Button
                type="button"
                variant={!hasStockEnabled ? "default" : "outline"}
                className="justify-start px-3"
                onClick={() => setStockAvailability(false)}
              >
                <PackageX />
                Sem estoque
              </Button>
            </div>
            <Input
              id="stock"
              type="number"
              min="0"
              disabled={!hasStockEnabled}
              {...register("stock")}
            />
            {errors.stock ? (
              <p className="text-sm text-destructive">{errors.stock.message}</p>
            ) : null}
          </div>
        </div>

        </CompactSection>

        <CompactSection
          title="Categoria e tamanhos"
          description={`${selectedCategory?.name ?? "Sem categoria"} • ${variationCount || "sem"} opção${variationCount === 1 ? "" : "ões"}`}
        >
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

          <div className="grid gap-3 self-start">
            <div className="grid gap-2">
              <Label>Tipo de tamanho</Label>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {sizePresets.map((preset) => {
                  const Icon = preset.icon;

                  return (
                    <Button
                      key={preset.id}
                      type="button"
                      variant="outline"
                      className="h-auto justify-start px-3 py-2 text-left"
                      onClick={() => applySizePreset(preset)}
                    >
                      <Icon />
                      <span>
                        <span className="block text-sm">{preset.label}</span>
                        <span className="block text-[11px] font-semibold text-muted-foreground">
                          {preset.description}
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="variation_label">Nome do seletor</Label>
              <Input
                id="variation_label"
                placeholder="Tamanho, Numeração, Volume..."
                {...register("variation_label")}
              />
              {errors.variation_label ? (
                <p className="text-sm text-destructive">
                  {errors.variation_label.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="variations">Opções</Label>
              <Input
                id="variations"
                placeholder="P, M, G ou 34, 35, 36"
                {...register("variations")}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Separe opções por vírgula. Use roupas, calçados ou uma lista manual.
              </p>
              {errors.variations ? (
                <p className="text-sm text-destructive">{errors.variations.message}</p>
              ) : null}
            </div>
          </div>
        </div>

        </CompactSection>

        <CompactSection
          title="Fotos"
          description={`${galleryImages.length}/8 imagens na galeria`}
          defaultOpen={galleryImages.length === 0}
        >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="image">Fotos do produto</Label>
            <Input
              id="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(event) => {
                addImageFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImagePlus className="size-4" />
              Selecione uma ou mais imagens em JPG, PNG, WebP ou AVIF, com até 5MB cada.
            </p>
          </div>

          <div className="grid gap-3">
            <div>
              <Label>Galeria atual</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                As fotos selecionadas aparecem na hora. Remova, arraste ou use as setas antes de salvar.
              </p>
            </div>
            {galleryImages.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {galleryImages.map((image, index) => {
                  const imageUrl = image.kind === "existing" ? image.url : image.previewUrl;
                  const imageAlt =
                    image.kind === "existing"
                      ? image.alt ?? product?.name ?? "Foto do produto"
                      : image.alt;

                  return (
                    <div
                      key={image.id}
                      onDragOver={allowImageDrop}
                      onDrop={(event) => {
                        event.preventDefault();
                        moveGalleryImageToTarget(image.id);
                        setDraggedImageId(null);
                      }}
                      data-dragging={draggedImageId === image.id}
                      className="drag-sort-item grid gap-2 rounded-none border-2 border-border bg-muted/35 p-2"
                    >
                      <div className="relative aspect-square overflow-hidden bg-background">
                        <Image
                          src={imageUrl}
                          alt={imageAlt}
                          fill
                          sizes="180px"
                          className="object-cover"
                          unoptimized
                        />
                        <span className="absolute left-2 top-2 bg-foreground px-2 py-1 text-xs font-black text-background">
                          {index + 1}
                        </span>
                        {image.kind === "pending" ? (
                          <span className="absolute bottom-2 left-2 bg-street-lime px-2 py-1 text-xs font-black text-foreground">
                            Nova foto
                          </span>
                        ) : null}
                        <button
                          type="button"
                          draggable
                          aria-label="Arrastar foto"
                          className="focus-ring absolute right-2 top-2 grid size-8 place-items-center border-2 border-foreground bg-background text-foreground"
                          onDragStart={() => setDraggedImageId(image.id)}
                          onDragEnd={() => setDraggedImageId(null)}
                        >
                          <GripVertical className="size-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Mover foto para cima"
                          disabled={index === 0}
                          onClick={() => moveGalleryImage(index, -1)}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Mover foto para baixo"
                          disabled={index === galleryImages.length - 1}
                          onClick={() => moveGalleryImage(index, 1)}
                        >
                          <ArrowDown />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          aria-label="Remover foto"
                          onClick={() => removeGalleryImage(image.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-none border-2 border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Nenhuma foto na galeria atual. Selecione imagens para visualizar antes de salvar.
              </div>
            )}
          </div>
        </div>
        </CompactSection>

        <CompactSection
          title="Vitrine"
          description="Destaques e ações finais do cadastro."
          defaultOpen={false}
        >
          <label className="flex items-center gap-3 rounded-none border-2 border-border bg-muted/40 p-3 text-sm font-medium">
            <input type="checkbox" className="size-4 accent-primary" {...register("featured")} />
            Produto em destaque na home
          </label>
        </CompactSection>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !hasChanges || categories.length === 0}
          >
            <Save />
            {isSubmitting ? "Salvando..." : "Salvar produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
