import type { Metadata } from "next";

import { updateCouponsAction } from "@/app/admin/cupons/actions";
import { CouponManager } from "@/components/CouponManager";
import { getCouponsSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Cupons Admin",
  description: "Gerencie cupons de desconto da loja.",
};

export default async function AdminCouponsPage() {
  const coupons = await getCouponsSetting();

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase text-primary">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Cupons</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Crie descontos por percentual ou valor fixo para aparecerem no drawer de cupons.
        </p>
      </div>

      <CouponManager coupons={coupons} action={updateCouponsAction} />
    </div>
  );
}
