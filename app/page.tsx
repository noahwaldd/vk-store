import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgePercent } from "lucide-react";

import { BrandMarquee } from "@/components/BrandMarquee";
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
          className="hidden object-cover opacity-75 sm:block"
          priority
          unoptimized
        />
        <Image
          src={heroImage.mobile.url}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-75 sm:hidden"
          priority
          unoptimized
        />
        <div className="pointer-events-none absolute inset-0 bg-foreground/55" />
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08)_0_2px,transparent_2px_18px)]" />
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

      <section className="container-shell py-16">
        <div className="mb-8 flex items-end justify-between gap-4 border-b-2 border-foreground pb-4">
          <div>
            <p className="font-display text-lg tracking-widest text-muted-foreground">
              Categorias
            </p>
            <h2 className="font-display text-4xl uppercase sm:text-6xl">
              Compre por seção
            </h2>
          </div>
          <Button
            asChild
            variant="ghost"
            className="rounded-none font-display text-lg uppercase tracking-wide hover:bg-foreground hover:text-background"
          >
            <Link href="/produtos">
              Ver tudo
              <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {categories.slice(0, 3).map((category, index) => (
            <Link
              key={category.id}
              href={`/produtos?categoria=${category.slug}`}
              data-animate
              className="group relative flex min-h-[320px] overflow-hidden border-2 border-foreground bg-foreground text-background transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0_var(--street-lime)]"
            >
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,var(--street-lime)_0_18px,var(--street-orange)_18px_36px,var(--asphalt)_36px_62px)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/65 to-foreground/15" />
              <div className="relative mt-auto grid min-h-48 content-end gap-4 p-6">
                <span className="w-fit border-2 border-background bg-street-lime px-3 py-1 text-xs font-black uppercase text-foreground">
                  Seção {index + 1}
                </span>
                <h3 className="font-display text-5xl uppercase leading-none sm:text-6xl">
                  {category.name}
                </h3>
                {category.description ? (
                  <p className="max-w-sm text-sm font-medium leading-6 text-background/82">
                    {category.description}
                  </p>
                ) : null}
                <span className="inline-flex min-h-11 w-fit items-center gap-2 border-2 border-background bg-background px-4 font-display text-lg uppercase text-foreground transition-colors group-hover:bg-street-lime">
                  Ver produtos
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="mb-8 flex items-end justify-between gap-4 border-b-2 border-foreground pb-4">
          <div>
            <p className="font-display text-lg tracking-widest text-muted-foreground">
              Destaques
            </p>
            <h2 className="font-display text-4xl uppercase sm:text-6xl">
              Produtos em destaque
            </h2>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-none border-2 border-foreground font-display text-lg uppercase tracking-wide hover:bg-foreground hover:text-background"
          >
            <Link href="/produtos">Ver catálogo</Link>
          </Button>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      <BrandMarquee />

      <section className="container-shell py-16">
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
