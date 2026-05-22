"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";

import type { AppearanceActionResult } from "@/app/admin/aparencia/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HeroImageSetting } from "@/lib/site-settings";

type HeroImageManagerProps = {
  currentImage: HeroImageSetting;
  action: (formData: FormData) => Promise<AppearanceActionResult>;
};

export function HeroImageManager({
  currentImage,
  action,
}: HeroImageManagerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [desktopPreview, setDesktopPreview] = useState(currentImage.desktop.url);
  const [mobilePreview, setMobilePreview] = useState(currentImage.mobile.url);
  const [hasDesktopFile, setHasDesktopFile] = useState(false);
  const [hasMobileFile, setHasMobileFile] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(
    currentImage.overlayEnabled ?? true,
  );
  const [savedOverlayEnabled, setSavedOverlayEnabled] = useState(
    currentImage.overlayEnabled ?? true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasChanges =
    hasDesktopFile || hasMobileFile || overlayEnabled !== savedOverlayEnabled;

  function updatePreview(
    file: File | null | undefined,
    fallbackUrl: string,
    setPreview: (url: string) => void,
  ) {
    if (!file) {
      setPreview(fallbackUrl);
      return;
    }

    setPreview(URL.createObjectURL(file));
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setIsSubmitting(true);

        try {
          const result = await action(formData);

          if (result.ok) {
            toast.success(result.message);
            formRef.current?.reset();
            setHasDesktopFile(false);
            setHasMobileFile(false);
            setSavedOverlayEnabled(overlayEnabled);
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Não foi possível salvar a capa.",
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="grid gap-4 border-2 border-foreground bg-background p-4"
    >
      <div className="grid gap-2">
        <h2 className="font-display text-2xl uppercase leading-none">
          Imagem da capa
        </h2>
        <p className="max-w-3xl text-sm leading-5 text-muted-foreground">
          Esta foto aparece atrás do título da primeira tela. Use uma imagem
          larga para computador e outra vertical para celular.
        </p>
      </div>

      <label className="flex items-center gap-3 border-2 border-border bg-muted/40 p-3 text-sm font-medium">
        <input
          name="overlay_enabled"
          type="checkbox"
          className="size-4 accent-primary"
          checked={overlayEnabled}
          onChange={(event) => setOverlayEnabled(event.target.checked)}
        />
        Aplicar efeito de contraste sobre a foto da capa
      </label>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-3">
          <div>
            <Label htmlFor="hero-desktop-image">Computador</Label>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Recomendado: 1920 x 900 px, até 5MB.
            </p>
          </div>
          <Input
            id="hero-desktop-image"
            name="desktop_image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) =>
              {
                const file = event.target.files?.[0];
                setHasDesktopFile(Boolean(file));
                updatePreview(file, currentImage.desktop.url, setDesktopPreview);
              }
            }
          />
          <div className="relative aspect-[16/7] overflow-hidden border-2 border-foreground bg-muted">
            {desktopPreview ? (
              <Image
                src={desktopPreview}
                alt="Prévia da capa no computador"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={`object-cover ${overlayEnabled ? "opacity-75" : ""}`}
                unoptimized
              />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <ImagePlus />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <Label htmlFor="hero-mobile-image">Celular</Label>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Recomendado: 1080 x 1600 px, até 5MB.
            </p>
          </div>
          <Input
            id="hero-mobile-image"
            name="mobile_image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) =>
              {
                const file = event.target.files?.[0];
                setHasMobileFile(Boolean(file));
                updatePreview(file, currentImage.mobile.url, setMobilePreview);
              }
            }
          />
          <div className="relative aspect-[9/14] max-h-[360px] overflow-hidden border-2 border-foreground bg-muted">
            {mobilePreview ? (
              <Image
                src={mobilePreview}
                alt="Prévia da capa no celular"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={`object-cover ${overlayEnabled ? "opacity-75" : ""}`}
                unoptimized
              />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <ImagePlus />
              </div>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !hasChanges}
        className="h-11 w-fit rounded-none"
      >
        <Save />
        {isSubmitting ? "Salvando..." : "Salvar capa"}
      </Button>
    </form>
  );
}
