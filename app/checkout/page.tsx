import type { Metadata } from "next";

import { CheckoutForm } from "@/components/CheckoutForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getCouponsSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize seu pedido pelo WhatsApp.",
};

export default async function CheckoutPage() {
  const [coupons, user] = await Promise.all([getCouponsSetting(), getCurrentUser()]);
  const profile = user
    ? await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          name: true,
          email: true,
          phone: true,
          checkout_name: true,
          checkout_email: true,
          checkout_phone: true,
          checkout_cep: true,
          checkout_address: true,
          checkout_number: true,
          checkout_city: true,
          checkout_state: true,
          legal_accepted_at: true,
        },
      })
    : null;
  const checkoutProfile = profile
    ? {
        name: profile.checkout_name ?? profile.name ?? user?.name ?? "",
        email: profile.checkout_email ?? profile.email ?? user?.email ?? "",
        phone: profile.checkout_phone ?? profile.phone ?? "",
        cep: profile.checkout_cep ?? "",
        address: profile.checkout_address ?? "",
        number: profile.checkout_number ?? "",
        city: profile.checkout_city ?? "",
        state: profile.checkout_state ?? "",
      }
    : null;

  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase text-primary">Pedido pelo WhatsApp</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Checkout</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Revise seus dados e envie o pedido pronto para o atendimento da loja.
        </p>
      </div>
      <CheckoutForm
        coupons={coupons}
        savedProfile={checkoutProfile}
        hasAcceptedLegal={Boolean(profile?.legal_accepted_at)}
        isAuthenticated={Boolean(user)}
      />
    </div>
  );
}
