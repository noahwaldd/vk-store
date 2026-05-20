import type { Metadata } from "next";

import { CheckoutForm } from "@/components/CheckoutForm";
import { getCouponsSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize seu pedido pelo WhatsApp.",
};

export default async function CheckoutPage() {
  const coupons = await getCouponsSetting();

  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase text-primary">Pedido pelo WhatsApp</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Checkout</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Revise seus dados e envie o pedido pronto para o atendimento da loja.
        </p>
      </div>
      <CheckoutForm coupons={coupons} />
    </div>
  );
}
