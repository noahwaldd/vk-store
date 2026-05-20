import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Package } from "lucide-react";

import { ProductDetailActions } from "@/components/ProductDetailActions";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { ProductViewTracker } from "@/components/ProductViewTracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCurrentAdminUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produto não encontrado",
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images.map((image) => image.url),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, adminUser] = await Promise.all([
    getRelatedProducts({
      productId: product.id,
      categoryId: product.category_id,
      limit: 4,
    }),
    getCurrentAdminUser(),
  ]);
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="container-shell py-8">
      <ProductViewTracker product={product} />

      <Button asChild variant="ghost" className="mb-6">
        <Link href="/produtos">
          <ArrowLeft />
          Voltar para produtos
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ProductImageGallery images={product.images} productName={product.name} />

        <section className="rounded-none border-2 border-foreground bg-background p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{product.category?.name ?? "Produto"}</Badge>
            {hasDiscount ? <Badge className="offer-badge">Oferta</Badge> : null}
            <Badge variant={product.stock > 0 ? "outline" : "secondary"}>
              {product.stock > 0 ? "Em estoque" : "Esgotado"}
            </Badge>
          </div>

          <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-5">
            {hasDiscount ? (
              <p className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compare_at_price ?? 0)}
              </p>
            ) : null}
            <p className="text-3xl font-black">{formatCurrency(product.price)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Atendimento pelo WhatsApp no horário da loja.
            </p>
          </div>

          <Separator className="my-6" />

          <ProductDetailActions product={product} />

          {adminUser ? (
            <Button asChild variant="outline" className="mt-3 w-full rounded-none">
              <Link href={`/admin/produtos/${product.id}/editar`}>
                Gerenciar este produto
              </Link>
            </Button>
          ) : null}

          <Separator className="my-6" />

          <div>
            <h2 className="font-bold">Descrição</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Clock className="size-4" />
              Segunda a sexta, 10:00-20:00. Sábado, 10:00-18:00. Domingo fechado.
            </span>
            <span className="flex items-center gap-2">
              <Package className="size-4" />
              Estoque atual: {product.stock} unidade{product.stock === 1 ? "" : "s"}.
            </span>
          </div>
        </section>
      </div>

      {relatedProducts.length ? (
        <section className="mt-14">
          <div className="mb-8 flex items-end justify-between gap-4 border-b-2 border-foreground pb-4">
            <div>
              <p className="font-display text-lg tracking-widest text-muted-foreground">
                Mesma categoria
              </p>
              <h2 className="font-display text-4xl uppercase sm:text-6xl">
                Veja também
              </h2>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-none border-2 border-foreground font-display text-lg uppercase tracking-wide hover:bg-foreground hover:text-background"
            >
              <Link href={`/produtos?categoria=${product.category?.slug ?? "todos"}`}>
                Ver categoria
              </Link>
            </Button>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      ) : null}
    </div>
  );
}
