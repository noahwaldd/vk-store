import type { Metadata } from "next";

import { updateCouponsAction } from "@/app/admin/cupons/actions";
import { CouponManager } from "@/components/CouponManager";
import { getCategories } from "@/lib/categories";
import { getCouponsSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Cupons Admin",
  description: "Gerencie cupons de desconto da loja.",
};

export default async function AdminCouponsPage() {
  const [coupons, categories] = await Promise.all([
    getCouponsSetting(),
    getCategories(),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Cupons</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Controle descontos por período, limite de uso, subtotal, quantidade e categorias.
        </p>
      </div>

      <CouponManager
        coupons={coupons}
        categories={categories}
        action={updateCouponsAction}
      />
    </div>
  );
}
