import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgePercent } from "lucide-react";

import { BrandMarquee } from "@/components/BrandMarquee";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { ProductGrid } from "@/components/ProductGrid";
import { Button } from "@/components/ui/button";
import { getCategories, getFeaturedProducts } from "@/lib/products";
import {
  getHeroImageSetting,
  getOfferSectionSetting,
} from "@/lib/site-settings";

function getOfferTitleLines(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return [title];
  }

  const splitIndex = Math.ceil(words.length / 2);

  return [
    words.slice(0, splitIndex).join(" "),
    words.slice(splitIndex).join(" "),
  ];
}

export default async function HomePage() {
  const [featuredProducts, categories, heroImage, offerSection] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getHeroImageSetting(),
    getOfferSectionSetting(),
  ]);
  const offerTitleLines = getOfferTitleLines(offerSection.title);

  return (
    <div>
      <section className="relative overflow-hidden bg-asphalt text-background">
        <Image
          src={heroImage.desktop.url}
          alt=""
          fill
          sizes="100vw"
          className={`hidden object-cover sm:block ${
            heroImage.overlayEnabled ? "opacity-75" : "opacity-100"
          }`}
          priority
          unoptimized
        />
        <Image
          src={heroImage.mobile.url}
          alt=""
          fill
          sizes="100vw"
          className={`object-cover sm:hidden ${
            heroImage.overlayEnabled ? "opacity-75" : "opacity-100"
          }`}
          priority
          unoptimized
        />
        {heroImage.overlayEnabled ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-foreground/55" />
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08)_0_2px,transparent_2px_18px)]" />
          </>
        ) : null}
        <div className="container-shell relative grid min-h-[520px] items-end py-10 md:min-h-[620px] md:py-12">
          <div className="max-w-3xl pb-10">
            <h1 className="font-graffiti text-7xl leading-[0.85] text-background sm:text-9xl lg:text-[150px]">
              VK Store
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-background/80 sm:text-lg">
              Roupas, perfumes e acessórios com energia de rua, visual forte e
              ofertas que aparecem direto na vitrine.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-14 rounded-none border-2 border-background bg-background px-10 font-display text-lg uppercase tracking-widest text-foreground transition-all hover:bg-transparent hover:text-background"
              >
                <Link href="/produtos">
                  Comprar agora
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-5 md:py-6 xl:py-8">
        <div className="mb-4 flex flex-col items-start gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-sm tracking-widest text-muted-foreground">
              Categorias
            </p>
            <h2 className="font-display text-3xl uppercase sm:text-4xl xl:text-5xl">
              Compre por seção
            </h2>
          </div>
          <Button
            asChild
            variant="ghost"
            className="rounded-none font-display text-base uppercase tracking-wide hover:bg-foreground hover:text-background"
          >
            <Link href="/produtos">
              Ver tudo
              <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>

        <CategoryCarousel categories={categories} />
      </section>

      <section className="container-shell pb-7 pt-3 md:pb-8 md:pt-5 xl:pb-10 xl:pt-6">
        <div className="mb-5 flex flex-col items-start gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-sm tracking-widest text-muted-foreground">
              Destaques
            </p>
            <h2 className="font-display text-3xl uppercase sm:text-4xl">
              Produtos em destaque
            </h2>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-none border border-border font-display text-base uppercase tracking-wide hover:bg-foreground hover:text-background"
          >
            <Link href="/produtos">Ver catálogo</Link>
          </Button>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      <BrandMarquee />

      <section className="container-shell py-8 md:py-10">
        <div
          data-animate
          className="grid gap-8 rounded-none border-2 border-foreground bg-foreground p-8 text-background md:grid-cols-[1fr_auto] md:items-center md:p-12 lg:p-16"
        >
          <div>
            <div className="mb-4 flex items-center gap-3 font-display text-lg tracking-widest text-background/60">
              <BadgePercent className="size-5" />
              {offerSection.eyebrow.toLocaleUpperCase("pt-BR")}
            </div>
            <h2 className="font-graffiti text-5xl leading-[0.9] text-background sm:text-6xl lg:text-8xl">
              {offerTitleLines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < offerTitleLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/80">
              {offerSection.description}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-14 rounded-none border-2 border-background bg-background px-10 font-display text-lg uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <Link href={offerSection.href}>{offerSection.buttonLabel}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
