"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductImage } from "@/types/product";

type ProductImageGalleryProps = {
  images: ProductImage[];
  productName: string;
};

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = images[activeIndex];
  const hasMultipleImages = images.length > 1;

  function goToPrevious() {
    setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  }

  function goToNext() {
    setActiveIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  }

  return (
    <div className="grid gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-none border-2 border-foreground bg-background">
        {activeImage ? (
          <button
            type="button"
            className="focus-ring relative block h-full w-full cursor-zoom-in"
            aria-label="Ver foto em tela cheia"
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt ?? productName}
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
              unoptimized
            />
          </button>
        ) : (
          <div className="grid h-full place-items-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-sm">Sem imagem</span>
          </div>
        )}

        {hasMultipleImages ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Foto anterior"
              className="icon-inline absolute left-3 top-1/2 -translate-y-1/2 rounded-none"
              onClick={goToPrevious}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Próxima foto"
              className="icon-inline absolute right-3 top-1/2 -translate-y-1/2 rounded-none"
              onClick={goToNext}
            >
              <ChevronRight />
            </Button>
            <div className="absolute bottom-3 left-3 bg-foreground px-3 py-1 text-xs font-black text-background">
              {activeIndex + 1}/{images.length}
            </div>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const selected = index === activeIndex;

            return (
              <button
                key={image.id}
                type="button"
                aria-label={`Ver foto ${index + 1}`}
                aria-pressed={selected}
                className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-none border-2 bg-background transition-colors sm:w-24 ${
                  selected ? "border-foreground" : "border-border hover:border-foreground"
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <Image
                  src={image.url}
                  alt={image.alt ?? productName}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="left-0 top-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 border-0 bg-transparent p-0 shadow-none"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{productName}</DialogTitle>
            <DialogDescription>Visualização da foto do produto.</DialogDescription>
          </DialogHeader>
          <div className="absolute inset-0 bg-black/78 backdrop-blur-md" />
          <div className="relative grid h-screen place-items-center p-3 sm:p-8">
            {activeImage ? (
              <div className="relative h-full w-full">
                <Image
                  src={activeImage.url}
                  alt={activeImage.alt ?? productName}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : null}
            {hasMultipleImages ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Foto anterior"
                  className="icon-inline absolute left-3 top-1/2 size-12 -translate-y-1/2 rounded-none sm:left-6 sm:size-14"
                  onClick={goToPrevious}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Próxima foto"
                  className="icon-inline absolute right-3 top-1/2 size-12 -translate-y-1/2 rounded-none sm:right-6 sm:size-14"
                  onClick={goToNext}
                >
                  <ChevronRight />
                </Button>
                <div className="absolute bottom-4 left-4 bg-background/92 px-3 py-1 text-xs font-black text-foreground backdrop-blur sm:bottom-6 sm:left-6">
                  {activeIndex + 1}/{images.length}
                </div>
              </>
            ) : null}
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Fechar"
                className="icon-inline absolute right-4 top-4 rounded-none sm:right-6 sm:top-6"
              >
                <span className="text-xl leading-none">×</span>
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
