"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Save } from "lucide-react";
import { toast } from "sonner";

import type { AppearanceActionResult } from "@/app/admin/aparencia/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PromoBannerSetting } from "@/lib/site-settings";

type PromoBannerManagerProps = {
  currentBanner: PromoBannerSetting;
  action: (formData: FormData) => Promise<AppearanceActionResult>;
};

function formatThreshold(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PromoBannerManager({
  currentBanner,
  action,
}: PromoBannerManagerProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(currentBanner.enabled);
  const [threshold, setThreshold] = useState(formatThreshold(currentBanner.threshold));
  const [message, setMessage] = useState(currentBanner.message);
  const [savedBanner, setSavedBanner] = useState(currentBanner);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasChanges =
    enabled !== savedBanner.enabled ||
    threshold !== formatThreshold(savedBanner.threshold) ||
    message !== savedBanner.message;

  return (
    <form
      action={async (formData) => {
        setIsSubmitting(true);

        try {
          const result = await action(formData);

          if (result.ok) {
            toast.success(result.message);
            const savedThreshold =
              Number(threshold.replace(/\./g, "").replace(",", ".")) || 0;
            setSavedBanner({
              enabled,
              threshold: savedThreshold,
              message,
            });
            setThreshold(formatThreshold(savedThreshold));
            router.refresh();
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Não foi possível salvar o aviso do topo.",
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="grid gap-4 border-2 border-foreground bg-background p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl uppercase leading-none">
            <Megaphone className="size-5" />
            Aviso do topo
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-5 text-muted-foreground">
            Controle a faixa chamativa acima do cabeçalho.
          </p>
        </div>
        <label className="flex items-center gap-2 border-2 border-border bg-muted/35 px-3 py-2 text-sm font-black">
          <input
            type="checkbox"
            name="enabled"
            className="size-4 accent-primary"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          {enabled ? "Ativo" : "Desativado"}
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="promo-threshold">Valor de referência</Label>
          <Input
            id="promo-threshold"
            name="threshold"
            inputMode="decimal"
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            placeholder="0,00"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="promo-message">Mensagem</Label>
          <Textarea
            id="promo-message"
            name="message"
            value={message}
            rows={2}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !hasChanges}
        className="h-11 w-fit rounded-none"
      >
        <Save />
        {isSubmitting ? "Salvando..." : "Salvar aviso"}
      </Button>
    </form>
  );
}
