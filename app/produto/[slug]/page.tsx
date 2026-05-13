import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package, ShieldCheck, Truck } from "lucide-react";

import { ProductDetailActions } from "@/components/ProductDetailActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { getProductBySlug } from "@/lib/products";

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
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const mainImage = product.images[0]?.url;
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="container-shell py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/produtos">
          <ArrowLeft />
          Voltar para produtos
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-none border-2 border-foreground bg-background">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.images[0]?.alt ?? product.name}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>

          {product.images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-none border-2 border-border bg-background"
                >
                  <Image
                    src={image.url}
                    alt={image.alt ?? product.name}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <section className="rounded-none border-2 border-foreground bg-background p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{product.category?.name ?? "Produto"}</Badge>
            {hasDiscount ? <Badge>Oferta</Badge> : null}
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
              Pagamento seguro e confirmação rápida do pedido.
            </p>
          </div>

          <Separator className="my-6" />

          <ProductDetailActions product={product} />

          <Separator className="my-6" />

          <div>
            <h2 className="font-bold">Descrição</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Truck className="size-4" />
              Entrega e retirada podem ser configuradas no checkout.
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Compra segura com pagamento protegido.
            </span>
            <span className="flex items-center gap-2">
              <Package className="size-4" />
              Estoque atual: {product.stock} unidade{product.stock === 1 ? "" : "s"}.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
