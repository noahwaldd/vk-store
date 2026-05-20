import type { Metadata } from "next";

import { CartPageClient } from "@/components/CartPageClient";
import { getCouponsSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Revise os produtos adicionados ao carrinho.",
};

export default async function CartPage() {
  const coupons = await getCouponsSetting();

  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase text-primary">Pedido</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Carrinho</h1>
      </div>
      <CartPageClient coupons={coupons} />
    </div>
  );
}
