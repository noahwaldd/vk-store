import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountCheckoutProfileForm } from "@/components/AccountCheckoutProfileForm";
import { AccountIdentityForm } from "@/components/AccountIdentityForm";
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
      checkout_cep: true,
      checkout_address: true,
      checkout_number: true,
      checkout_city: true,
      checkout_state: true,
      legal_accepted_at: true,
    },
  });
  const accountName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const displayName = profile?.name ?? (accountName || user.name);
  const checkoutProfile = {
    cep: profile?.checkout_cep ?? "",
    address: profile?.checkout_address ?? "",
    number: profile?.checkout_number ?? "",
    city: profile?.checkout_city ?? "",
    state: profile?.checkout_state ?? "",
  };

  return (
    <div className="container-shell py-6 lg:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-5">
          <section className="border-2 border-foreground bg-background p-5 sm:p-6">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Conta VK
            </p>
            <h1 className="mt-3 font-graffiti text-4xl leading-none sm:text-5xl">
              Minha conta
            </h1>
          </section>

          <AccountIdentityForm
            name={displayName ?? ""}
            email={profile?.email ?? user.email ?? ""}
            phone={profile?.phone ?? ""}
            isAdmin={isAdmin}
          />

          <AccountCheckoutProfileForm
            initialProfile={checkoutProfile}
            hasAcceptedLegal={Boolean(profile?.legal_accepted_at)}
          />
        </div>

        <aside className="h-fit border-2 border-foreground bg-background p-5 sm:p-6">
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
