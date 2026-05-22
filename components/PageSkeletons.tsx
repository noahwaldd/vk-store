import { Skeleton } from "@/components/ui/skeleton";

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-none border-2 border-border bg-background p-3">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <Skeleton className="mt-4 h-3 w-20 rounded-none" />
      <Skeleton className="mt-2 h-5 w-4/5 rounded-none" />
      <Skeleton className="mt-3 h-4 w-2/3 rounded-none" />
      <div className="mt-4 flex items-end justify-between gap-3">
        <Skeleton className="h-7 w-24 rounded-none" />
        <Skeleton className="h-6 w-16 rounded-none" />
      </div>
      <Skeleton className="mt-4 h-10 w-full rounded-none" />
    </div>
  );
}

function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

function PageHeadingSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-24 rounded-none" />
      <Skeleton className="mt-3 h-10 w-64 rounded-none" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl rounded-none" />
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div>
      <section className="bg-asphalt">
        <div className="container-shell grid min-h-[520px] items-end py-10 md:min-h-[620px]">
          <div className="max-w-3xl pb-10">
            <Skeleton className="h-24 w-full max-w-xl rounded-none bg-background/20 sm:h-32" />
            <Skeleton className="mt-6 h-5 w-full max-w-lg rounded-none bg-background/20" />
            <Skeleton className="mt-3 h-5 w-3/4 rounded-none bg-background/20" />
            <Skeleton className="mt-8 h-14 w-48 rounded-none bg-background/25" />
          </div>
        </div>
      </section>
      <section className="container-shell py-8 md:py-10">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
          <PageHeadingSkeleton />
          <Skeleton className="hidden h-10 w-28 rounded-none sm:block" />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="min-h-[210px] rounded-none" />
          ))}
        </div>
      </section>
      <section className="container-shell py-8 md:py-10">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
          <PageHeadingSkeleton />
          <Skeleton className="hidden h-10 w-32 rounded-none sm:block" />
        </div>
        <ProductGridSkeleton />
      </section>
      <section className="container-shell py-8 md:py-10">
        <Skeleton className="h-64 rounded-none" />
      </section>
    </div>
  );
}

export function CatalogPageSkeleton() {
  return (
    <div className="container-shell grid gap-6 py-10">
      <PageHeadingSkeleton />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-none" />
        ))}
      </div>
      <div className="grid gap-3 rounded-none border-2 border-foreground bg-background p-3 md:grid-cols-[1fr_190px_190px_auto]">
        <Skeleton className="h-10 rounded-none" />
        <Skeleton className="h-10 rounded-none" />
        <Skeleton className="h-10 rounded-none" />
        <Skeleton className="h-10 rounded-none" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40 rounded-none" />
        <Skeleton className="h-8 w-28 rounded-none" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}

export function ProductDetailPageSkeleton() {
  return (
    <div className="container-shell py-8">
      <Skeleton className="mb-6 h-10 w-44 rounded-none" />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-none" />
            ))}
          </div>
        </div>
        <section className="rounded-none border-2 border-foreground bg-background p-6">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24 rounded-none" />
            <Skeleton className="h-6 w-20 rounded-none" />
            <Skeleton className="h-6 w-28 rounded-none" />
          </div>
          <Skeleton className="mt-5 h-12 w-full max-w-md rounded-none" />
          <Skeleton className="mt-5 h-9 w-40 rounded-none" />
          <Skeleton className="mt-2 h-4 w-64 rounded-none" />
          <Skeleton className="my-6 h-0.5 w-full rounded-none" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-16 rounded-none" />
            ))}
          </div>
          <Skeleton className="mt-5 h-12 w-full rounded-none" />
          <Skeleton className="my-6 h-0.5 w-full rounded-none" />
          <Skeleton className="h-5 w-28 rounded-none" />
          <Skeleton className="mt-3 h-4 w-full rounded-none" />
          <Skeleton className="mt-2 h-4 w-5/6 rounded-none" />
        </section>
      </div>
      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between border-b-2 border-foreground pb-4">
          <PageHeadingSkeleton />
          <Skeleton className="hidden h-10 w-28 rounded-none sm:block" />
        </div>
        <ProductGridSkeleton count={4} />
      </section>
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="container-shell py-10">
      <PageHeadingSkeleton />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid gap-4 border-2 border-border p-4 sm:grid-cols-[96px_1fr_auto]">
              <Skeleton className="aspect-square rounded-none" />
              <div>
                <Skeleton className="h-5 w-3/4 rounded-none" />
                <Skeleton className="mt-3 h-4 w-40 rounded-none" />
                <Skeleton className="mt-4 h-8 w-28 rounded-none" />
              </div>
              <Skeleton className="h-8 w-24 rounded-none" />
            </div>
          ))}
        </div>
        <Skeleton className="h-72 rounded-none" />
      </div>
    </div>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <div className="container-shell py-10">
      <PageHeadingSkeleton />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4 rounded-none border-2 border-foreground p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-none" />
          ))}
          <Skeleton className="h-12 w-44 rounded-none" />
        </div>
        <div className="rounded-none border-2 border-foreground p-5">
          <Skeleton className="h-6 w-40 rounded-none" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="mt-4 h-16 rounded-none" />
          ))}
          <Skeleton className="mt-6 h-10 w-full rounded-none" />
        </div>
      </div>
    </div>
  );
}

export function LoginPageSkeleton() {
  return (
    <div className="container-shell grid min-h-[70vh] items-center py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-none border-2 border-foreground bg-background p-6">
        <Skeleton className="h-12 w-56 rounded-none" />
        <Skeleton className="mt-4 h-4 w-80 max-w-full rounded-none" />
        <div className="mt-8 grid gap-4">
          <Skeleton className="h-12 rounded-none" />
          <Skeleton className="h-12 rounded-none" />
          <Skeleton className="h-12 rounded-none" />
          <Skeleton className="h-12 rounded-none" />
        </div>
      </section>
      <Skeleton className="hidden min-h-[560px] rounded-none lg:block" />
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="container-shell py-10">
      <PageHeadingSkeleton />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Skeleton className="h-40 rounded-none" />
        <Skeleton className="h-40 rounded-none" />
        <Skeleton className="h-40 rounded-none" />
      </div>
      <Skeleton className="mt-6 h-72 rounded-none" />
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeadingSkeleton />
        <Skeleton className="h-10 w-36 rounded-none" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-none" />
        <Skeleton className="h-32 rounded-none" />
        <Skeleton className="h-32 rounded-none" />
      </div>
      <Skeleton className="h-52 rounded-none" />
      <Skeleton className="h-56 rounded-none" />
    </div>
  );
}

export function AdminProductsSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeadingSkeleton />
        <Skeleton className="h-10 w-36 rounded-none" />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-none" />
        ))}
      </div>
      <Skeleton className="h-52 rounded-none" />
      <div className="rounded-none border-2 border-border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[64px_1fr_120px_90px_120px] gap-4 border-b p-4 last:border-b-0">
            <Skeleton className="size-12 rounded-none" />
            <Skeleton className="h-6 rounded-none" />
            <Skeleton className="h-6 rounded-none" />
            <Skeleton className="h-6 rounded-none" />
            <Skeleton className="h-8 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-32 rounded-none" />
      <div className="grid gap-6 rounded-none border-2 border-foreground bg-background p-5">
        <Skeleton className="h-12 rounded-none" />
        <Skeleton className="h-28 rounded-none" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-12 rounded-none" />
          <Skeleton className="h-12 rounded-none" />
          <Skeleton className="h-12 rounded-none" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-64 rounded-none" />
          <Skeleton className="h-28 rounded-none" />
        </div>
        <Skeleton className="h-28 rounded-none" />
        <div className="flex justify-end gap-3">
          <Skeleton className="h-10 w-24 rounded-none" />
          <Skeleton className="h-10 w-36 rounded-none" />
        </div>
      </div>
    </div>
  );
}

export function AdminAppearanceSkeleton() {
  return (
    <div className="grid gap-6">
      <PageHeadingSkeleton />
      <div className="grid gap-5 border-2 border-foreground bg-background p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <Skeleton className="h-8 w-52 rounded-none" />
          <Skeleton className="h-4 w-full max-w-lg rounded-none" />
          <Skeleton className="h-12 rounded-none" />
          <Skeleton className="h-12 rounded-none" />
          <Skeleton className="h-10 w-32 rounded-none" />
        </div>
        <Skeleton className="aspect-[4/5] rounded-none" />
      </div>
    </div>
  );
}

export function AdminManagerSkeleton() {
  return (
    <div className="grid gap-6">
      <PageHeadingSkeleton />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="h-[420px] rounded-none" />
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LegalPageSkeleton() {
  return (
    <div className="container-shell py-10">
      <Skeleton className="h-4 w-28 rounded-none" />
      <Skeleton className="mt-3 h-12 w-full max-w-xl rounded-none" />
      <div className="mt-8 grid gap-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-5 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}
