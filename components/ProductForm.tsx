"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
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
  Droplets,
  Footprints,
  GripVertical,
  ImagePlus,
  PackageCheck,
  PackageX,
  Palette,
  Plus,
  Ruler,
  Save,
  Shirt,
  Trash2,
  X,
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

type VariationDraft = {
  id: string;
  label: string;
  values: string;
  stockByValue: Record<string, string>;
  imageByValue: Record<string, string>;
};

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
    id: "fragrance",
    label: "Perfumaria",
    description: "Amostras a 200ml",
    icon: Droplets,
    variationLabel: "Volume",
    values: [
      "30 ml",
      "50 ml",
      "75 ml",
      "100 ml",
      "125 ml",
      "150 ml",
      "200 ml",
    ],
  },
  {
    id: "colors",
    label: "Cores",
    description: "Variação visual",
    icon: Palette,
    variationLabel: "Cor",
    values: [
      "Preto",
      "Branco",
      "Cinza",
      "Azul",
      "Vermelho",
      "Rosa",
      "Verde",
      "Bege",
      "Marrom",
    ],
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

function createVariationDraftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `variation-${crypto.randomUUID()}`;
  }

  return `variation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createVariationDraft(
  label = "Variação",
  values: readonly string[] = [],
  id = createVariationDraftId(),
  stockByValue: Record<string, number> = {},
  imageByValue: Record<string, string> = {},
): VariationDraft {
  return {
    id,
    label,
    values: values.join(", "),
    stockByValue: Object.fromEntries(
      values.map((value) => [
        value,
        stockByValue[value] === undefined ? "" : String(stockByValue[value]),
      ]),
    ),
    imageByValue: Object.fromEntries(
      values.flatMap((value) => {
        const imageRef = imageByValue[value];

        return imageRef ? [[value, imageRef]] : [];
      }),
    ),
  };
}

function getVariationValues(values: string) {
  const seenValues = new Set<string>();

  return values
    .split(",")
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLocaleLowerCase("pt-BR");

      if (!item || seenValues.has(key)) {
        return false;
      }

      seenValues.add(key);
      return true;
    });
}

function normalizeVariationDrafts(groups: VariationDraft[]) {
  const seenLabels = new Set<string>();

  return groups.flatMap((group) => {
    const label = group.label.trim();
    const values = getVariationValues(group.values);
    const labelKey = label.toLocaleLowerCase("pt-BR");

    if (!label || !values.length || seenLabels.has(labelKey)) {
      return [];
    }

    seenLabels.add(labelKey);

    const stockByValue = values.reduce<Record<string, number>>((stockMap, value) => {
      const rawStock = group.stockByValue[value];

      if (rawStock === undefined || rawStock === "") {
        return stockMap;
      }

      const stock = Number(rawStock);

      if (Number.isFinite(stock)) {
        stockMap[value] = Math.max(0, Math.floor(stock));
      }

      return stockMap;
    }, {});
    const imageByValue = values.reduce<Record<string, string>>((imageMap, value) => {
      const imageRef = group.imageByValue[value];

      if (imageRef) {
        imageMap[value] = imageRef;
      }

      return imageMap;
    }, {});

    return [
      {
        label,
        values,
        ...(Object.keys(stockByValue).length ? { stockByValue } : {}),
        ...(Object.keys(imageByValue).length ? { imageByValue } : {}),
      },
    ];
  });
}

function getVariationSignature(groups: VariationDraft[]) {
  return JSON.stringify(normalizeVariationDrafts(groups));
}

function getGallerySignature(images: ManagedGalleryImage[]) {
  return JSON.stringify(
    images.map((image) =>
      image.kind === "existing" ? `existing:${image.id}` : `pending:${image.id}`,
    ),
  );
}

function getGalleryImageUrl(image: ManagedGalleryImage) {
  return image.kind === "existing" ? image.url : image.previewUrl;
}

function getGalleryImageLabel(image: ManagedGalleryImage, index: number) {
  return `Foto ${index + 1}${image.kind === "pending" ? " (nova)" : ""}`;
}

function findGalleryImageByReference(images: ManagedGalleryImage[], imageRef?: string) {
  if (!imageRef) {
    return undefined;
  }

  return images.find((image) => {
    if (image.id === imageRef) {
      return true;
    }

    return image.kind === "existing" && (image.url === imageRef || image.key === imageRef);
  });
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

function findInitialImageReference(product: Product | undefined, imageRef: string | undefined) {
  if (!product || !imageRef) {
    return "";
  }

  return (
    product.images.find(
      (image) => image.id === imageRef || image.url === imageRef || image.key === imageRef,
    )?.id ?? imageRef
  );
}

function buildInitialVariationGroups(product?: Product): VariationDraft[] {
  const variations = product?.variations ?? [];

  if (!variations.length) {
    return [createVariationDraft("Tamanho", [], "variation-initial-empty")];
  }

  return variations.map((variation, index) =>
    createVariationDraft(
      variation.label,
      variation.values,
      `variation-initial-${index}`,
      variation.stockByValue,
      Object.fromEntries(
        variation.values.flatMap((value) => {
          const imageRef = findInitialImageReference(product, variation.imageByValue?.[value]);

          return imageRef ? [[value, imageRef]] : [];
        }),
      ),
    ),
  );
}

export function ProductForm({ categories, product, action }: ProductFormProps) {
  const initialGallery = useMemo(() => buildInitialGallery(product), [product]);
  const initialGallerySignature = useMemo(
    () => getGallerySignature(initialGallery),
    [initialGallery],
  );
  const initialVariationGroups = useMemo(
    () => buildInitialVariationGroups(product),
    [product],
  );
  const initialVariationSignature = useMemo(
    () => getVariationSignature(initialVariationGroups),
    [initialVariationGroups],
  );
  const [galleryImages, setGalleryImages] = useState<ManagedGalleryImage[]>(initialGallery);
  const [variationGroups, setVariationGroups] = useState<VariationDraft[]>(
    initialVariationGroups,
  );
  const [variationInputs, setVariationInputs] = useState<Record<string, string>>({});
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
      is_offer: product?.is_offer ?? false,
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
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const normalizedVariationGroups = useMemo(
    () => normalizeVariationDrafts(variationGroups),
    [variationGroups],
  );
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
  const variationDirty =
    getVariationSignature(variationGroups) !== initialVariationSignature;
  const hasChanges = isDirty || galleryDirty || variationDirty;
  const stockNumber = Number(selectedStock) || 0;
  const variationCount = normalizedVariationGroups.reduce(
    (total, group) => total + group.values.length,
    0,
  );

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
    setVariationGroups((groups) =>
      groups.map((group) => ({
        ...group,
        imageByValue: Object.fromEntries(
          Object.entries(group.imageByValue).filter(([, imageRef]) => imageRef !== imageId),
        ),
      })),
    );
  }

  function applySizePreset(preset: (typeof sizePresets)[number]) {
    const nextGroup = createVariationDraft(preset.variationLabel, preset.values);

    setVariationGroups((groups) => {
      const matchingIndex = groups.findIndex(
        (group) =>
          group.label.trim().toLocaleLowerCase("pt-BR") ===
          preset.variationLabel.toLocaleLowerCase("pt-BR"),
      );

      if (matchingIndex >= 0) {
        return groups.map((group, index) => (index === matchingIndex ? nextGroup : group));
      }

      const firstGroup = groups[0];

      if (
        groups.length === 1 &&
        firstGroup &&
        !firstGroup.values.trim() &&
        firstGroup.label.trim().toLocaleLowerCase("pt-BR") === "tamanho"
      ) {
        return [nextGroup];
      }

      return [...groups, nextGroup];
    });
  }

  function addVariationGroup() {
    setVariationGroups((groups) => [...groups, createVariationDraft()]);
  }

  function setVariationInput(groupId: string, value: string) {
    setVariationInputs((inputs) => ({
      ...inputs,
      [groupId]: value,
    }));
  }

  function addVariationValues(groupId: string) {
    const rawValue = variationInputs[groupId] ?? "";
    const nextValues = getVariationValues(rawValue);

    if (!nextValues.length) {
      return;
    }

    setVariationGroups((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const mergedValues = getVariationValues(
          [...getVariationValues(group.values), ...nextValues].join(", "),
        );
        const stockByValue = Object.fromEntries(
          mergedValues.map((value) => [value, group.stockByValue[value] ?? ""]),
        );
        const imageByValue = Object.fromEntries(
          mergedValues.flatMap((value) => {
            const imageRef = group.imageByValue[value];

            return imageRef ? [[value, imageRef]] : [];
          }),
        );

        return {
          ...group,
          values: mergedValues.join(", "),
          stockByValue,
          imageByValue,
        };
      }),
    );
    setVariationInput(groupId, "");
  }

  function removeVariationValue(groupId: string, value: string) {
    setVariationGroups((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const valueKey = value.toLocaleLowerCase("pt-BR");

        return {
          ...group,
          values: getVariationValues(group.values)
            .filter((item) => item.toLocaleLowerCase("pt-BR") !== valueKey)
            .join(", "),
          stockByValue: Object.fromEntries(
            Object.entries(group.stockByValue).filter(
              ([key]) => key.toLocaleLowerCase("pt-BR") !== valueKey,
            ),
          ),
          imageByValue: Object.fromEntries(
            Object.entries(group.imageByValue).filter(
              ([key]) => key.toLocaleLowerCase("pt-BR") !== valueKey,
            ),
          ),
        };
      }),
    );
  }

  function updateVariationValueStock(
    groupId: string,
    value: string,
    stock: string,
  ) {
    setVariationGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              stockByValue: {
                ...group.stockByValue,
                [value]: stock.replace(/\D/g, ""),
              },
            }
          : group,
      ),
    );
  }

  function updateVariationValueImage(
    groupId: string,
    value: string,
    imageRef: string,
  ) {
    setVariationGroups((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const nextImageByValue = { ...group.imageByValue };

        if (imageRef) {
          nextImageByValue[value] = imageRef;
        } else {
          delete nextImageByValue[value];
        }

        return {
          ...group,
          imageByValue: nextImageByValue,
        };
      }),
    );
  }

  function handleVariationInputKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    groupId: string,
  ) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addVariationValues(groupId);
  }

  function updateVariationGroup(
    groupId: string,
    field: keyof Pick<VariationDraft, "label" | "values">,
    value: string,
  ) {
    setVariationGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              [field]: value,
            }
          : group,
      ),
    );
  }

  function removeVariationGroup(groupId: string) {
    setVariationInputs((inputs) => {
      const nextInputs = { ...inputs };
      delete nextInputs[groupId];
      return nextInputs;
    });
    setVariationGroups((groups) => {
      const nextGroups = groups.filter((group) => group.id !== groupId);

      return nextGroups.length ? nextGroups : [createVariationDraft("Tamanho")];
    });
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
    formData.append("variation_groups", JSON.stringify(normalizedVariationGroups));
    appendField(
      formData,
      "variations",
      normalizedVariationGroups[0]?.values.join(", ") ?? values.variations,
    );
    appendField(
      formData,
      "variation_label",
      normalizedVariationGroups[0]?.label ?? values.variation_label,
    );
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

    if (values.is_offer) {
      formData.append("is_offer", "on");
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
          defaultOpen={!product}
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
          defaultOpen={!product}
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
            <p className="text-xs leading-5 text-muted-foreground">
              Se informar estoque nas opções de variação, o checkout usa o estoque da opção
              escolhida.
            </p>
            {errors.stock ? (
              <p className="text-sm text-destructive">{errors.stock.message}</p>
            ) : null}
          </div>
        </div>

        </CompactSection>

        <CompactSection
          title="Categoria e variações"
          description={`${selectedCategory?.name ?? "Sem categoria"} • ${variationCount || "sem"} opção${variationCount === 1 ? "" : "ões"}`}
          defaultOpen={!product}
        >
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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
            <label>
              <span className="sr-only">Buscar categoria</span>
              <Input
                value={categoryQuery}
                onChange={(event) => setCategoryQuery(event.target.value)}
                placeholder="Buscar categoria"
              />
            </label>
            {categories.length === 0 ? (
              <div className="border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">
                Cadastre uma categoria antes de criar produtos.
              </div>
            ) : (
              <div className="grid max-h-56 gap-2 overflow-y-auto border-2 border-border p-2 sm:grid-cols-2 xl:grid-cols-1">
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
                      className={`min-w-0 border-2 p-2.5 text-left transition-colors ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:border-foreground"
                      }`}
                    >
                      <span className="block truncate text-sm font-black uppercase">
                        {category.name}
                      </span>
                      <span
                        className={`block truncate text-xs ${
                          selected ? "text-background/70" : "text-muted-foreground"
                        }`}
                      >
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
              <Label>Tipos de tamanho e variação</Label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sizePresets.map((preset) => {
                  const Icon = preset.icon;

                  return (
                    <Button
                      key={preset.id}
                      type="button"
                      variant="outline"
                      className="h-auto min-w-[150px] shrink-0 justify-start px-3 py-2 text-left"
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

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Grupos de variação</Label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Use um grupo para tamanho, outro para cor, volume, fragrância ou material.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addVariationGroup}>
                  <Plus />
                  Grupo
                </Button>
              </div>

              {variationGroups.map((group, index) => (
                <div
                  key={group.id}
                  className="grid min-w-0 gap-3 border-2 border-border bg-muted/30 p-3"
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase text-muted-foreground">
                        Variação {index + 1}
                      </span>
                      <p className="mt-1 truncate text-sm font-bold">
                        {group.label.trim() || "Sem nome"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remover grupo de variação"
                      onClick={() => removeVariationGroup(group.id)}
                    >
                      <X />
                    </Button>
                  </div>
                  <div className="grid min-w-0 gap-3 xl:grid-cols-[160px_minmax(0,1fr)]">
                    <div className="grid gap-2 self-start">
                      <Label htmlFor={`variation-label-${group.id}`}>Nome</Label>
                      <Input
                        id={`variation-label-${group.id}`}
                        value={group.label}
                        placeholder="Tamanho, Cor..."
                        onChange={(event) =>
                          updateVariationGroup(group.id, "label", event.target.value)
                        }
                      />
                    </div>

                    <div className="grid min-w-0 gap-2">
                      <Label htmlFor={`variation-input-${group.id}`}>Opções</Label>
                      <div className="min-h-11 rounded-none border-2 border-border bg-background p-2">
                        {getVariationValues(group.values).length ? (
                          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                            {getVariationValues(group.values).map((value) => {
                              const linkedImage = findGalleryImageByReference(
                                galleryImages,
                                group.imageByValue[value],
                              );
                              const linkedImageUrl = linkedImage
                                ? getGalleryImageUrl(linkedImage)
                                : "";

                              return (
                                <div
                                  key={value}
                                  className="grid min-w-0 gap-2 border-2 border-border bg-muted px-2 py-2"
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <div className="relative size-9 shrink-0 overflow-hidden border border-border bg-background">
                                      {linkedImageUrl ? (
                                        <Image
                                          src={linkedImageUrl}
                                          alt={value}
                                          fill
                                          sizes="36px"
                                          className="object-cover"
                                          unoptimized
                                        />
                                      ) : (
                                        <Palette className="m-2 size-5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <span className="min-w-0 flex-1 truncate text-xs font-black">
                                      {value}
                                    </span>
                                    <button
                                      type="button"
                                      aria-label={`Remover ${value}`}
                                      className="grid size-7 shrink-0 place-items-center hover:text-destructive"
                                      onClick={() => removeVariationValue(group.id, value)}
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  </div>
                                  <div className="grid min-w-0 gap-2 min-[460px]:grid-cols-[5rem_minmax(0,1fr)]">
                                    <Input
                                      type="number"
                                      min="0"
                                      inputMode="numeric"
                                      value={group.stockByValue[value] ?? ""}
                                      placeholder="Est."
                                      aria-label={`Estoque de ${value}`}
                                      className="h-8 min-w-0 border bg-background px-2 text-xs"
                                      onChange={(event) =>
                                        updateVariationValueStock(
                                          group.id,
                                          value,
                                          event.target.value,
                                        )
                                      }
                                    />
                                    <select
                                      value={group.imageByValue[value] ?? ""}
                                      aria-label={`Foto de ${value}`}
                                      className="focus-ring h-8 min-w-0 rounded-none border-2 border-border bg-background px-2 text-xs font-semibold"
                                      onChange={(event) =>
                                        updateVariationValueImage(
                                          group.id,
                                          value,
                                          event.target.value,
                                        )
                                      }
                                    >
                                      <option value="">Sem foto</option>
                                      {galleryImages.map((image, imageIndex) => (
                                        <option key={image.id} value={image.id}>
                                          {getGalleryImageLabel(image, imageIndex)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="px-1 py-1 text-xs font-semibold text-muted-foreground">
                            Nenhuma opção adicionada.
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <Input
                          id={`variation-input-${group.id}`}
                          value={variationInputs[group.id] ?? ""}
                          placeholder="Digite e pressione Enter"
                          onChange={(event) => setVariationInput(group.id, event.target.value)}
                          onKeyDown={(event) => handleVariationInputKeyDown(event, group.id)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => addVariationValues(group.id)}
                        >
                          <Plus />
                          Adicionar
                        </Button>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Pode colar várias opções separadas por vírgula. Cada valor vira uma
                        escolha no produto.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {errors.variation_groups ? (
                <p className="text-sm text-destructive">
                  {errors.variation_groups.message}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        </CompactSection>

        <CompactSection
          title="Fotos"
          description={`${galleryImages.length}/8 imagens na galeria`}
          defaultOpen={!product && galleryImages.length === 0}
        >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="image">Fotos do produto</Label>
            <Input
              id="image"
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(event) => {
                addImageFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Label
              htmlFor="image"
              className="focus-ring inline-flex h-10 w-fit cursor-pointer items-center justify-center gap-2 border border-border bg-background px-4 text-sm font-black uppercase text-foreground transition-colors hover:bg-muted"
            >
              <ImagePlus className="size-4" />
              {galleryImages.length ? "Adicionar fotos" : "Selecionar fotos"}
            </Label>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImagePlus className="size-4" />
              {galleryImages.length
                ? `${galleryImages.length} foto${galleryImages.length === 1 ? "" : "s"} na galeria.`
                : "Nenhuma foto adicionada."}{" "}
              JPG, PNG, WebP ou AVIF, com até 5MB cada.
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
                        <button
                          type="button"
                          draggable
                          aria-label={`Arrastar foto ${index + 1}`}
                          className="focus-ring relative block h-full w-full cursor-grab active:cursor-grabbing"
                          onDragStart={() => setDraggedImageId(image.id)}
                          onDragEnd={() => setDraggedImageId(null)}
                        >
                          <Image
                            src={imageUrl}
                            alt={imageAlt}
                            fill
                            sizes="180px"
                            className="object-cover"
                            unoptimized
                          />
                        </button>
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
          <label className="flex items-start gap-3 rounded-none border-2 border-border bg-muted/40 p-3 text-sm font-medium">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              {...register("is_offer")}
            />
            <span>
              <span className="block">Marcar como oferta especial</span>
              <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                Use para campanhas e para aparecer em Ver ofertas. Desconto comum usa apenas o
                preço original.
              </span>
            </span>
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
