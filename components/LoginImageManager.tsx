"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";

import type { AppearanceActionResult } from "@/app/admin/aparencia/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoginImageSetting } from "@/lib/site-settings";

type LoginImageManagerProps = {
  currentImage: LoginImageSetting;
  action: (formData: FormData) => Promise<AppearanceActionResult>;
};

export function LoginImageManager({
  currentImage,
  action,
}: LoginImageManagerProps) {
  const [previewUrl, setPreviewUrl] = useState(currentImage.url);
  const [grayscale, setGrayscale] = useState(currentImage.grayscale ?? true);
  const [savedGrayscale, setSavedGrayscale] = useState(currentImage.grayscale ?? true);
  const [hasSelectedFile, setHasSelectedFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasChanges = hasSelectedFile || grayscale !== savedGrayscale;

  function handleImageChange(file?: File | null) {
    if (!file) {
      setPreviewUrl(currentImage.url);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <form
      action={async (formData) => {
        setIsSubmitting(true);

        try {
          const result = await action(formData);

          if (result.ok) {
            toast.success(result.message);
            setSavedGrayscale(grayscale);
            setHasSelectedFile(false);
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Não foi possível salvar a foto do login.",
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="grid gap-4 border-2 border-foreground bg-background p-4 lg:grid-cols-[minmax(0,1fr)_260px]"
    >
      <div className="grid content-start gap-3">
        <div>
          <h2 className="font-display text-2xl uppercase leading-none">
            Foto do login
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Use uma foto vertical, clara e com o produto ou modelo bem visível.
            Recomendado: 1200 x 1500 px, até 5MB.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="login-image" className="sr-only">
            Foto do login
          </Label>
          <Input
            id="login-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setHasSelectedFile(Boolean(file));
              handleImageChange(file);
            }}
          />
        </div>

        <label className="flex items-center gap-3 border-2 border-border bg-muted/40 p-3 text-sm font-medium">
          <input
            name="grayscale"
            type="checkbox"
            className="size-4 accent-primary"
            checked={grayscale}
            onChange={(event) => setGrayscale(event.target.checked)}
          />
          Exibir foto em preto e branco
        </label>

        <Button
          type="submit"
          disabled={isSubmitting || !hasChanges}
          className="h-11 w-fit rounded-none"
        >
          <Save />
          {isSubmitting ? "Salvando..." : "Salvar foto"}
        </Button>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-bold uppercase text-muted-foreground">
          Prévia
        </p>
        <div className="relative aspect-[4/5] overflow-hidden border-2 border-foreground bg-muted">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Prévia da foto do login"
              fill
              sizes="320px"
              className={`object-contain p-3 ${grayscale ? "grayscale" : ""}`}
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              <ImagePlus />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
