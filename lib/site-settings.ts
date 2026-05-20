import "server-only";

import {
  defaultCoupons,
  normalizeCouponCode,
  type CouponAppliesTo,
  type DiscountCoupon,
} from "@/lib/coupons";
import { prisma } from "@/lib/db/prisma";

export type LoginImageSetting = {
  url: string;
  key: string | null;
  grayscale?: boolean;
};

export type HeroImageSetting = {
  desktop: LoginImageSetting;
  mobile: LoginImageSetting;
};

export type OfferSectionSetting = {
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
};

export type PromoBannerSetting = {
  enabled: boolean;
  threshold: number;
  message: string;
};

export const defaultLoginImage: LoginImageSetting = {
  url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1400&q=85",
  key: null,
  grayscale: true,
};

export const defaultHeroImage: HeroImageSetting = {
  desktop: {
    url: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=2400&q=85",
    key: null,
  },
  mobile: {
    url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
    key: null,
  },
};

export const defaultOfferSection: OfferSectionSetting = {
  eyebrow: "Promoção",
  title: "Ofertas Selecionadas",
  description:
    "Peças, fragrâncias e acessórios com preço competitivo por tempo limitado.",
  buttonLabel: "Ver ofertas",
  href: "/produtos?ordenar=promocoes",
};

export const defaultPromoBanner: PromoBannerSetting = {
  enabled: true,
  threshold: 0,
  message:
    "Atendimento pelo WhatsApp: segunda a sexta, 10:00-20:00; sábado, 10:00-18:00.",
};

const loginImageSettingKey = "login_image";
const heroImageSettingKey = "hero_image";
const offerSectionSettingKey = "offer_section";
const promoBannerSettingKey = "promo_banner";
const couponsSettingKey = "coupons";

function parseLoginImage(value: unknown): LoginImageSetting | null {
  if (!value || typeof value !== "object" || !("url" in value)) {
    return null;
  }

  const setting = value as { url?: unknown; key?: unknown; grayscale?: unknown };

  if (typeof setting.url !== "string" || !setting.url) {
    return null;
  }

  return {
    url: setting.url,
    key: typeof setting.key === "string" ? setting.key : null,
    grayscale: typeof setting.grayscale === "boolean" ? setting.grayscale : undefined,
  };
}

function parseHeroImage(value: unknown): HeroImageSetting | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const setting = value as { desktop?: unknown; mobile?: unknown };
  const desktop = parseLoginImage(setting.desktop);
  const mobile = parseLoginImage(setting.mobile);

  if (!desktop && !mobile) {
    return null;
  }

  return {
    desktop: desktop ?? defaultHeroImage.desktop,
    mobile: mobile ?? desktop ?? defaultHeroImage.mobile,
  };
}

function readStringField(
  value: Record<string, unknown>,
  field: keyof OfferSectionSetting,
) {
  const candidate = value[field];

  if (typeof candidate !== "string" || !candidate.trim()) {
    return defaultOfferSection[field];
  }

  return candidate.trim();
}

function normalizeOfferHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//")
    ? href
    : defaultOfferSection.href;
}

function parseOfferSection(value: unknown): OfferSectionSetting | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const setting = value as Record<string, unknown>;

  return {
    eyebrow: readStringField(setting, "eyebrow"),
    title: readStringField(setting, "title"),
    description: readStringField(setting, "description"),
    buttonLabel: readStringField(setting, "buttonLabel"),
    href: normalizeOfferHref(readStringField(setting, "href")),
  };
}

function parsePromoBanner(value: unknown): PromoBannerSetting | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const setting = value as Record<string, unknown>;
  const enabled =
    typeof setting.enabled === "boolean"
      ? setting.enabled
      : defaultPromoBanner.enabled;
  const threshold =
    typeof setting.threshold === "number" && Number.isFinite(setting.threshold)
      ? setting.threshold
      : defaultPromoBanner.threshold;
  const rawMessage =
    typeof setting.message === "string" && setting.message.trim()
      ? setting.message.trim()
      : defaultPromoBanner.message;
  const message = /frete|entrega/i.test(rawMessage)
    ? defaultPromoBanner.message
    : rawMessage;

  return {
    enabled,
    threshold: Math.max(threshold, 0),
    message,
  };
}

function parseCoupons(value: unknown): DiscountCoupon[] {
  if (!Array.isArray(value)) {
    return defaultCoupons;
  }

  return value.flatMap((item): DiscountCoupon[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const coupon = item as Record<string, unknown>;
    const code =
      typeof coupon.code === "string" ? normalizeCouponCode(coupon.code) : "";
    const discountType =
      coupon.discountType === "fixed" || coupon.discountType === "percentage"
        ? coupon.discountType
        : "percentage";
    const discountValue =
      typeof coupon.discountValue === "number" &&
      Number.isFinite(coupon.discountValue)
        ? coupon.discountValue
        : 0;
    const appliesTo: CouponAppliesTo =
      coupon.appliesTo === "categories" ? "categories" : "order";

    if (!code || discountValue <= 0) {
      return [];
    }

    return [
      {
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
        minimumSubtotal:
          typeof coupon.minimumSubtotal === "number" &&
          Number.isFinite(coupon.minimumSubtotal)
            ? Math.max(coupon.minimumSubtotal, 0)
            : 0,
        minimumQuantity:
          typeof coupon.minimumQuantity === "number" &&
          Number.isFinite(coupon.minimumQuantity)
            ? Math.max(Math.floor(coupon.minimumQuantity), 0)
            : 0,
        startsAt:
          typeof coupon.startsAt === "string" && coupon.startsAt.trim()
            ? coupon.startsAt.trim()
            : null,
        endsAt:
          typeof coupon.endsAt === "string" && coupon.endsAt.trim()
            ? coupon.endsAt.trim()
            : null,
        usageLimit:
          typeof coupon.usageLimit === "number" && Number.isFinite(coupon.usageLimit)
            ? Math.max(Math.floor(coupon.usageLimit), 1)
            : null,
        usageLimitPerCustomer:
          typeof coupon.usageLimitPerCustomer === "number" &&
          Number.isFinite(coupon.usageLimitPerCustomer)
            ? Math.max(Math.floor(coupon.usageLimitPerCustomer), 1)
            : null,
        usedCount:
          typeof coupon.usedCount === "number" && Number.isFinite(coupon.usedCount)
            ? Math.max(Math.floor(coupon.usedCount), 0)
            : 0,
        appliesTo,
        categoryIds:
          appliesTo === "categories" && Array.isArray(coupon.categoryIds)
            ? coupon.categoryIds.filter((id): id is string => typeof id === "string")
            : [],
        excludeSaleItems: Boolean(coupon.excludeSaleItems),
        enabled:
          typeof coupon.enabled === "boolean" ? coupon.enabled : true,
      },
    ];
  });
}

export async function getLoginImageSetting() {
  const setting = await prisma.siteSetting.findUnique({
    where: {
      key: loginImageSettingKey,
    },
  });

  return parseLoginImage(setting?.value) ?? defaultLoginImage;
}

export async function getHeroImageSetting() {
  const setting = await prisma.siteSetting.findUnique({
    where: {
      key: heroImageSettingKey,
    },
  });

  return parseHeroImage(setting?.value) ?? defaultHeroImage;
}

export async function getOfferSectionSetting() {
  const setting = await prisma.siteSetting.findUnique({
    where: {
      key: offerSectionSettingKey,
    },
  });

  return parseOfferSection(setting?.value) ?? defaultOfferSection;
}

export async function getPromoBannerSetting() {
  const setting = await prisma.siteSetting.findUnique({
    where: {
      key: promoBannerSettingKey,
    },
  });

  return parsePromoBanner(setting?.value) ?? defaultPromoBanner;
}

export async function getCouponsSetting() {
  const setting = await prisma.siteSetting.findUnique({
    where: {
      key: couponsSettingKey,
    },
  });

  const coupons = parseCoupons(setting?.value);
  const codes = coupons.map((coupon) => coupon.code);

  if (!codes.length) {
    return coupons;
  }

  const usage = await prisma.order.groupBy({
    by: ["coupon_code"],
    where: {
      coupon_code: {
        in: codes,
      },
      status: {
        not: "canceled",
      },
    },
    _count: {
      _all: true,
    },
  });
  const usageByCode = new Map(
    usage.flatMap((item) =>
      item.coupon_code
        ? [[item.coupon_code, item._count._all] as const]
        : [],
    ),
  );

  return coupons.map((coupon) => ({
    ...coupon,
    usedCount: usageByCode.get(coupon.code) ?? 0,
  }));
}

export async function updateLoginImageSetting(setting: LoginImageSetting) {
  await prisma.siteSetting.upsert({
    where: {
      key: loginImageSettingKey,
    },
    create: {
      key: loginImageSettingKey,
      value: setting,
    },
    update: {
      value: setting,
    },
  });
}

export async function updateHeroImageSetting(setting: HeroImageSetting) {
  await prisma.siteSetting.upsert({
    where: {
      key: heroImageSettingKey,
    },
    create: {
      key: heroImageSettingKey,
      value: setting,
    },
    update: {
      value: setting,
    },
  });
}

export async function updateOfferSectionSetting(setting: OfferSectionSetting) {
  await prisma.siteSetting.upsert({
    where: {
      key: offerSectionSettingKey,
    },
    create: {
      key: offerSectionSettingKey,
      value: setting,
    },
    update: {
      value: setting,
    },
  });
}

export async function updatePromoBannerSetting(setting: PromoBannerSetting) {
  await prisma.siteSetting.upsert({
    where: {
      key: promoBannerSettingKey,
    },
    create: {
      key: promoBannerSettingKey,
      value: setting,
    },
    update: {
      value: setting,
    },
  });
}

export async function updateCouponsSetting(coupons: DiscountCoupon[]) {
  await prisma.siteSetting.upsert({
    where: {
      key: couponsSettingKey,
    },
    create: {
      key: couponsSettingKey,
      value: coupons,
    },
    update: {
      value: coupons,
    },
  });
}
