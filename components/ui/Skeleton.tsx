import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Placeholder block for loading.tsx files; size it with className
export const Skeleton = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn(
      "rounded-sm bg-surface-raised motion-safe:animate-pulse",
      className,
    )}
  />
);

// A card-shaped placeholder: label, title and a few lines
export const CardSkeleton = ({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) => (
  <div
    aria-hidden
    className={cn(
      "flex flex-col gap-3 rounded-lg border border-line bg-surface p-4",
      className,
    )}
  >
    <Skeleton className="h-3 w-28" />
    <Skeleton className="h-6 w-3/5" />
    {Array.from({ length: lines }, (_, index) => (
      <Skeleton key={index} className="h-4 w-full" />
    ))}
  </div>
);

// Placeholder for a standings or results list: position, team bar, name, value
export const ListSkeleton = ({
  rows = 8,
  className,
}: {
  rows?: number;
  className?: string;
}) => (
  <div aria-hidden className={cn("flex flex-col", className)}>
    {Array.from({ length: rows }, (_, index) => (
      <div
        key={index}
        className="flex min-h-[54px] items-center gap-2 border-b border-line-soft"
      >
        <Skeleton className="h-4 w-5" />
        <Skeleton className="h-[30px] w-1 rounded-[2px]" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
        <Skeleton className="h-4 w-9" />
      </div>
    ))}
  </div>
);

// Announces loading to screen readers; wrap the skeletons of a loading.tsx in it
export const LoadingRegion = ({
  children,
  label = "Loading",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) => (
  <div role="status" aria-label={label} className={className}>
    {children}
  </div>
);
