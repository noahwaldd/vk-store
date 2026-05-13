import Link from "next/link";
import { ArrowRight, BadgePercent } from "lucide-react";

import { BrandMarquee } from "@/components/BrandMarquee";
import { ProductGrid } from "@/components/ProductGrid";
import { Button } from "@/components/ui/button";
import { getCategories, getFeaturedProducts } from "@/lib/products";

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden bg-asphalt text-background">
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

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/produtos?categoria=${category.slug}`}
              data-animate
              className="group flex flex-col justify-between rounded-none border-2 border-foreground bg-secondary p-8 transition-all hover:-translate-y-1 hover:bg-street-lime"
            >
              <div>
                <h3 className="font-display text-3xl uppercase leading-none">
                  {category.name}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground group-hover:text-foreground/75">
                  {category.description}
                </p>
              </div>
              <ArrowRight className="mt-8 size-8 transition-transform group-hover:translate-x-2" />
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
              PROMOÇÃO
            </div>
            <h2 className="font-graffiti text-5xl leading-[0.9] text-background sm:text-6xl lg:text-8xl">
              Ofertas <br /> Selecionadas
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/80">
              Peças, fragrâncias e acessórios com preço competitivo por tempo limitado.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-14 rounded-none border-2 border-background bg-background px-10 font-display text-lg uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <Link href="/produtos?ordenar=promocoes">Ver ofertas</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
