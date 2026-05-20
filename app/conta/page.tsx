import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Área autenticada da VK Store.",
};

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/conta");
  }

  const isAdmin = isAdminUser(user);
  const profile = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      name: true,
      first_name: true,
      last_name: true,
      phone: true,
      email: true,
    },
  });
  const displayName =
    profile?.name ??
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ??
    user.name;

  return (
    <div className="container-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="border-2 border-foreground bg-background p-6 sm:p-8">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Conta VK
          </p>
          <h1 className="mt-3 font-graffiti text-5xl leading-none sm:text-6xl">
            Minha conta
          </h1>

          <div className="mt-8 grid gap-4 text-sm">
            <div className="border-2 border-foreground p-4">
              <p className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Nome
              </p>
              <p className="mt-2 font-bold">{displayName || "Não informado"}</p>
            </div>
            <div className="border-2 border-foreground p-4">
              <p className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
                E-mail
              </p>
              <p className="mt-2 break-all font-bold">{profile?.email ?? user.email}</p>
            </div>
            {profile?.phone ? (
              <div className="border-2 border-foreground p-4">
                <p className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Celular
                </p>
                <p className="mt-2 font-bold">{profile.phone}</p>
              </div>
            ) : null}
            {isAdmin ? (
              <div className="border-2 border-foreground p-4">
                <p className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Acesso
                </p>
                <p className="mt-2 inline-flex items-center gap-2 font-bold">
                  <ShieldCheck className="size-4" />
                  Administrador
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="h-fit border-2 border-foreground bg-background p-6">
          <div className="grid gap-3">
            <Button asChild className="rounded-none">
              <Link href="/produtos">Ver produtos</Link>
            </Button>
            {isAdmin ? (
              <Button asChild variant="outline" className="rounded-none">
                <Link href="/admin">Abrir painel</Link>
              </Button>
            ) : null}
            <SignOutButton />
          </div>
        </aside>
      </div>
    </div>
  );
}
