import { Skeleton } from "@/components/ui/skeleton";

export function Loading() {
  return (
    <div className="container-shell grid gap-6 py-8">
      <Skeleton className="h-10 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-none border-2 border-border bg-background p-3">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="mt-4 h-4 w-4/5" />
            <Skeleton className="mt-2 h-5 w-1/2" />
            <Skeleton className="mt-4 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
