import type { Metadata } from "next";

import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize sua compra com segurança.",
};

export default function CheckoutPage() {
  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase text-primary">Pagamento</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Checkout</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Revise seus dados e confirme o pagamento para concluir o pedido.
        </p>
      </div>
      <CheckoutForm />
    </div>
  );
}
