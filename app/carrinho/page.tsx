import type { Metadata } from "next";

import { CartPageClient } from "@/components/CartPageClient";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Revise os produtos adicionados ao carrinho.",
};

export default function CartPage() {
  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase text-primary">Pedido</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Carrinho</h1>
      </div>
      <CartPageClient />
    </div>
  );
}
