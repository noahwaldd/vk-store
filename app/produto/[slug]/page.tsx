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
    <div className="mx-auto w-[min(calc(100%_-_1.5rem),1120px)] py-4 sm:w-[min(calc(100%_-_2rem),1120px)]">
      <ProductViewTracker product={product} />

      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/produtos">
          <ArrowLeft />
          Voltar para produtos
        </Link>
      </Button>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <ProductImageGallery images={product.images} productName={product.name} />

        <section className="min-w-0 rounded-none border-2 border-foreground bg-background p-4 lg:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{product.category?.name ?? "Produto"}</Badge>
            {hasDiscount ? <Badge className="offer-badge">Oferta</Badge> : null}
            <Badge variant={product.stock > 0 ? "outline" : "secondary"}>
              {product.stock > 0 ? "Em estoque" : "Esgotado"}
            </Badge>
          </div>

          <h1 className="mt-3 min-w-0 break-words text-2xl font-black leading-tight sm:text-[1.7rem]">
            {product.name}
          </h1>

          <div className="mt-3 min-w-0">
            {hasDiscount ? (
              <p className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compare_at_price ?? 0)}
              </p>
            ) : null}
            <p className="break-words text-[1.7rem] font-black leading-tight">
              {formatCurrency(product.price)}
            </p>
            <p className="mt-1 break-words text-sm text-muted-foreground">
              Atendimento pelo WhatsApp no horário da loja.
            </p>
          </div>

          <Separator className="my-3" />

          <ProductDetailActions product={product} />

          {adminUser ? (
            <Button asChild variant="outline" className="mt-3 w-full rounded-none">
              <Link href={`/admin/produtos/${product.id}/editar`}>
                Gerenciar este produto
              </Link>
            </Button>
          ) : null}

          <Separator className="my-3" />

          <div className="min-w-0">
            <h2 className="font-bold">Descrição</h2>
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <span className="flex min-w-0 items-start gap-2">
              <Clock className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 break-words">
                Segunda a sexta, 10:00-20:00. Sábado, 10:00-18:00. Domingo fechado.
              </span>
            </span>
            <span className="flex min-w-0 items-start gap-2">
              <Package className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 break-words">
                Estoque atual: {product.stock} unidade{product.stock === 1 ? "" : "s"}.
              </span>
            </span>
          </div>
        </section>
      </div>

      {relatedProducts.length ? (
        <section className="mt-10">
          <div className="mb-5 flex flex-col items-start gap-3 border-b-2 border-foreground pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="font-display text-base tracking-widest text-muted-foreground">
                Mesma categoria
              </p>
              <h2 className="break-words font-display text-3xl uppercase sm:text-4xl">
                Veja também
              </h2>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-none border-2 border-foreground font-display text-base uppercase hover:bg-foreground hover:text-background sm:w-auto"
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
