"use server";

import { revalidatePath } from "next/cache";

import {
  normalizeCouponCode,
  type CouponAppliesTo,
  type CouponDiscountType,
  type DiscountCoupon,
} from "@/lib/coupons";
import { requireAdminUser } from "@/lib/auth";
import { updateCouponsSetting } from "@/lib/site-settings";

export type CouponActionResult = {
  ok: boolean;
  message: string;
};

function parseNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : Number.NaN;
}

function parseOptionalLimit(value: unknown) {
  const parsed = parseNumber(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
}

function parseDateText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isValidDateText(value: string | null) {
  return !value || !Number.isNaN(new Date(value).getTime());
}

function parseCoupons(raw: unknown): DiscountCoupon[] {
  if (typeof raw !== "string") {
    throw new Error("Lista de cupons inválida.");
  }

  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Lista de cupons inválida.");
  }

  const seenCodes = new Set<string>();

  return parsed.map((item, index): DiscountCoupon => {
    if (!item || typeof item !== "object") {
      throw new Error(`Cupom ${index + 1} inválido.`);
    }

    const coupon = item as Record<string, unknown>;
    const code = normalizeCouponCode(String(coupon.code ?? ""));
    const discountType: CouponDiscountType =
      coupon.discountType === "fixed" ? "fixed" : "percentage";
    const discountValue = parseNumber(coupon.discountValue);
    const minimumSubtotal = parseNumber(coupon.minimumSubtotal ?? 0);
    const minimumQuantity = parseOptionalLimit(coupon.minimumQuantity) ?? 0;
    const usageLimit = parseOptionalLimit(coupon.usageLimit);
    const usageLimitPerCustomer = parseOptionalLimit(coupon.usageLimitPerCustomer);
    const startsAt = parseDateText(coupon.startsAt);
    const endsAt = parseDateText(coupon.endsAt);
    const appliesTo: CouponAppliesTo =
      coupon.appliesTo === "categories" ? "categories" : "order";
    const categoryIds = Array.isArray(coupon.categoryIds)
      ? coupon.categoryIds.filter((id): id is string => typeof id === "string")
      : [];

    if (!code) {
      throw new Error(`Informe o código do cupom ${index + 1}.`);
    }

    if (seenCodes.has(code)) {
      throw new Error(`O código ${code} está duplicado.`);
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      throw new Error(`Informe um desconto válido para ${code}.`);
    }

    if (discountType === "percentage" && discountValue > 100) {
      throw new Error(`O percentual de ${code} não pode passar de 100%.`);
    }

    if (!Number.isFinite(minimumSubtotal) || minimumSubtotal < 0) {
      throw new Error(`Informe um mínimo válido para ${code}.`);
    }

    if (!isValidDateText(startsAt) || !isValidDateText(endsAt)) {
      throw new Error(`Informe datas válidas para ${code}.`);
    }

    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      throw new Error(`A data final de ${code} deve ser depois da data inicial.`);
    }

    if (appliesTo === "categories" && !categoryIds.length) {
      throw new Error(`Selecione ao menos uma categoria para ${code}.`);
    }

    seenCodes.add(code);

    return {
      id:
        typeof coupon.id === "string" && coupon.id
          ? coupon.id
          : `coupon-${code.toLowerCase()}`,
      code,
      title:
        typeof coupon.title === "string" && coupon.title.trim()
          ? coupon.title.trim()
          : `${discountValue}${discountType === "percentage" ? "%" : " reais"} de desconto`,
      description:
        typeof coupon.description === "string" ? coupon.description.trim() : "",
      discountType,
      discountValue,
      minimumSubtotal,
      minimumQuantity,
      startsAt,
      endsAt,
      usageLimit,
      usageLimitPerCustomer,
      usedCount:
        typeof coupon.usedCount === "number" && Number.isFinite(coupon.usedCount)
          ? Math.max(Math.floor(coupon.usedCount), 0)
          : 0,
      appliesTo,
      categoryIds,
      excludeSaleItems: Boolean(coupon.excludeSaleItems),
      enabled: Boolean(coupon.enabled),
    };
  });
}

export async function updateCouponsAction(
  formData: FormData,
): Promise<CouponActionResult> {
  try {
    await requireAdminUser();
    const coupons = parseCoupons(formData.get("coupons"));

    await updateCouponsSetting(coupons);
    revalidatePath("/", "layout");
    revalidatePath("/carrinho");
    revalidatePath("/checkout");
    revalidatePath("/admin/cupons");

    return {
      ok: true,
      message: "Cupons atualizados.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Não foi possível salvar os cupons.",
    };
  }
}
