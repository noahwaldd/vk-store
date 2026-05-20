import type { Metadata } from "next";

import {
  updateHeroImagesAction,
  updateLoginImageAction,
  updateOfferSectionAction,
  updatePromoBannerAction,
} from "@/app/admin/aparencia/actions";
import { HeroImageManager } from "@/components/HeroImageManager";
import { LoginImageManager } from "@/components/LoginImageManager";
import { OfferSectionManager } from "@/components/OfferSectionManager";
import { PromoBannerManager } from "@/components/PromoBannerManager";
import {
  getHeroImageSetting,
  getLoginImageSetting,
  getOfferSectionSetting,
  getPromoBannerSetting,
} from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Aparência Admin",
  description: "Configure imagens e elementos visuais da loja.",
};

export default async function AdminAppearancePage() {
  const [loginImage, heroImage, offerSection, promoBanner] = await Promise.all([
    getLoginImageSetting(),
    getHeroImageSetting(),
    getOfferSectionSetting(),
    getPromoBannerSetting(),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase text-primary">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Aparência</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Configure as imagens principais que aparecem na loja.
        </p>
      </div>

      <HeroImageManager
        currentImage={heroImage}
        action={updateHeroImagesAction}
      />

      <PromoBannerManager
        currentBanner={promoBanner}
        action={updatePromoBannerAction}
      />

      <LoginImageManager
        currentImage={loginImage}
        action={updateLoginImageAction}
      />

      <OfferSectionManager
        currentSection={offerSection}
        action={updateOfferSectionAction}
      />
    </div>
  );
}
