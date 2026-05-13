import { PackageSearch } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
};

export function EmptyState({ title, description, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-none border-2 border-dashed border-foreground bg-background p-10 text-center",
        className,
      )}
    >
      <PackageSearch className="mb-4 size-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
