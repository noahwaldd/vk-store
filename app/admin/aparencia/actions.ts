"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import {
  defaultOfferSection,
  defaultPromoBanner,
  getHeroImageSetting,
  getLoginImageSetting,
  updatePromoBannerSetting,
  updateOfferSectionSetting,
  updateHeroImageSetting,
  updateLoginImageSetting,
} from "@/lib/site-settings";
import { uploadHeroImageToS3, uploadLoginImageToS3 } from "@/lib/storage/s3";

export type AppearanceActionResult = {
  ok: boolean;
  message: string;
};

function getImageFile(formData: FormData, fieldName: string) {
  const image = formData.get(fieldName);

  return image instanceof File && image.size > 0 ? image : null;
}

function readTextField(formData: FormData, fieldName: string, fallback: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readInternalHref(formData: FormData) {
  const href = readTextField(formData, "href", defaultOfferSection.href);

  if (!href.startsWith("/") || href.startsWith("//")) {
    throw new Error("Use um link interno da loja, começando com /.");
  }

  return href;
}

function parseCurrencyValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  const sanitized = value.trim().replace(/[^\d,.-]/g, "");

  if (!sanitized) {
    return Number.NaN;
  }

  const normalized = sanitized.includes(",")
    ? sanitized.replace(/\./g, "").replace(",", ".")
    : sanitized;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : Number.NaN;
}

export async function updateLoginImageAction(
  formData: FormData,
): Promise<AppearanceActionResult> {
  try {
    await requireAdminUser();

    const image = getImageFile(formData, "image");
    const grayscale = formData.get("grayscale") === "on";
    const currentImage = await getLoginImageSetting();
    const uploadedImage = image ? await uploadLoginImageToS3(image) : null;

    if (image && !uploadedImage) {
      return {
        ok: false,
        message: "Imagem inválida.",
      };
    }

    await updateLoginImageSetting({
      ...(uploadedImage ?? currentImage),
      grayscale,
    });

    revalidatePath("/login");
    revalidatePath("/admin/aparencia");

    return { ok: true, message: "Configuração do login atualizada." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a foto.",
    };
  }
}

export async function updateHeroImagesAction(
  formData: FormData,
): Promise<AppearanceActionResult> {
  try {
    await requireAdminUser();

    const desktopImage = getImageFile(formData, "desktop_image");
    const mobileImage = getImageFile(formData, "mobile_image");

    if (!desktopImage && !mobileImage) {
      return {
        ok: false,
        message: "Escolha pelo menos uma imagem.",
      };
    }

    const currentImage = await getHeroImageSetting();
    const [uploadedDesktop, uploadedMobile] = await Promise.all([
      desktopImage ? uploadHeroImageToS3(desktopImage) : Promise.resolve(null),
      mobileImage ? uploadHeroImageToS3(mobileImage) : Promise.resolve(null),
    ]);

    await updateHeroImageSetting({
      desktop: uploadedDesktop ?? currentImage.desktop,
      mobile: uploadedMobile ?? currentImage.mobile,
    });

    revalidatePath("/");
    revalidatePath("/admin/aparencia");

    return { ok: true, message: "Imagens da capa atualizadas." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as imagens da capa.",
    };
  }
}

export async function updateOfferSectionAction(
  formData: FormData,
): Promise<AppearanceActionResult> {
  try {
    await requireAdminUser();

    await updateOfferSectionSetting({
      eyebrow: readTextField(formData, "eyebrow", defaultOfferSection.eyebrow),
      title: readTextField(formData, "title", defaultOfferSection.title),
      description: readTextField(
        formData,
        "description",
        defaultOfferSection.description,
      ),
      buttonLabel: readTextField(
        formData,
        "buttonLabel",
        defaultOfferSection.buttonLabel,
      ),
      href: readInternalHref(formData),
    });

    revalidatePath("/");
    revalidatePath("/admin/aparencia");

    return { ok: true, message: "Bloco de ofertas atualizado." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o bloco de ofertas.",
    };
  }
}

export async function updatePromoBannerAction(
  formData: FormData,
): Promise<AppearanceActionResult> {
  try {
    await requireAdminUser();

    const threshold = parseCurrencyValue(
      formData.get("threshold") || defaultPromoBanner.threshold,
    );

    if (!Number.isFinite(threshold) || threshold < 0) {
      throw new Error("Informe um valor válido para o aviso.");
    }

    await updatePromoBannerSetting({
      enabled: formData.get("enabled") === "on",
      threshold,
      message: readTextField(formData, "message", defaultPromoBanner.message),
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/aparencia");

    return { ok: true, message: "Aviso do topo atualizado." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o aviso do topo.",
    };
  }
}
