"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const consentKey = "vkstore-cookie-consent";

type CookieChoice = "necessary" | "all";
type BannerState = CookieChoice | "pending" | "unset";

export function CookieConsentBanner() {
  const [choice, setChoice] = useState<BannerState>("pending");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const savedChoice = window.localStorage.getItem(consentKey) as CookieChoice | null;
      setChoice(savedChoice ?? "unset");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function saveChoice(nextChoice: CookieChoice) {
    window.localStorage.setItem(consentKey, nextChoice);
    setChoice(nextChoice);
  }

  if (choice !== "unset") {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] border-2 border-foreground bg-background p-4 shadow-[8px_8px_0_var(--foreground)] sm:inset-x-auto sm:right-5 sm:max-w-md">
      <div className="grid gap-3">
        <div>
          <h2 className="font-display text-2xl uppercase leading-none">
            Preferência de cookies
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Usamos cookies essenciais para login, segurança e carrinho. Cookies
            opcionais só devem ser usados para melhorar a loja ou medir visitas.
          </p>
        </div>
        <Link href="/cookies" className="text-sm font-bold underline">
          Ver política de cookies
        </Link>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => saveChoice("necessary")}
          >
            Somente necessários
          </Button>
          <Button type="button" onClick={() => saveChoice("all")}>
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
