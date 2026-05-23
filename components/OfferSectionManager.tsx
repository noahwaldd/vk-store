"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import type { AppearanceActionResult } from "@/app/admin/aparencia/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OfferSectionSetting } from "@/lib/site-settings";

type OfferSectionManagerProps = {
  currentSection: OfferSectionSetting;
  action: (formData: FormData) => Promise<AppearanceActionResult>;
};

export function OfferSectionManager({
  currentSection,
  action,
}: OfferSectionManagerProps) {
  const [eyebrow, setEyebrow] = useState(currentSection.eyebrow);
  const [title, setTitle] = useState(currentSection.title);
  const [description, setDescription] = useState(currentSection.description);
  const [buttonLabel, setButtonLabel] = useState(currentSection.buttonLabel);
  const [href, setHref] = useState(currentSection.href);
  const [savedSection, setSavedSection] = useState(currentSection);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasChanges =
    eyebrow !== savedSection.eyebrow ||
    title !== savedSection.title ||
    description !== savedSection.description ||
    buttonLabel !== savedSection.buttonLabel ||
    href !== savedSection.href;

  return (
    <form
      action={async (formData) => {
        setIsSubmitting(true);

        try {
          const result = await action(formData);

          if (result.ok) {
            toast.success(result.message);
            setSavedSection({
              eyebrow,
              title,
              description,
              buttonLabel,
              href,
            });
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Não foi possível salvar o bloco de ofertas.",
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="grid gap-4 border-2 border-foreground bg-background p-4"
    >
      <div className="grid gap-2">
        <h2 className="font-display text-2xl uppercase leading-none">
          Bloco de ofertas
        </h2>
        <p className="max-w-3xl text-sm leading-5 text-muted-foreground">
          Controle o texto e o link do bloco de conversão exibido na home.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="grid gap-2">
          <Label htmlFor="offer-eyebrow">Chamada pequena</Label>
          <Input
            id="offer-eyebrow"
            name="eyebrow"
            value={eyebrow}
            onChange={(event) => setEyebrow(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="offer-title">Título</Label>
          <Input
            id="offer-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="offer-description">Descrição</Label>
          <Textarea
            id="offer-description"
            name="description"
            value={description}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="offer-button-label">Texto do botão</Label>
          <Input
            id="offer-button-label"
            name="buttonLabel"
            value={buttonLabel}
            onChange={(event) => setButtonLabel(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="offer-href">Link do botão</Label>
          <Input
            id="offer-href"
            name="href"
            value={href}
            placeholder="/produtos?oferta=1"
            onChange={(event) => setHref(event.target.value)}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !hasChanges}
        className="h-11 w-fit rounded-none"
      >
        <Save />
        {isSubmitting ? "Salvando..." : "Salvar ofertas"}
      </Button>
    </form>
  );
}
