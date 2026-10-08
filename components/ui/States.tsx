import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const EmptyState = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn("flex justify-center py-6", className)}>
    <p className="text-center text-muted">{children}</p>
  </div>
);

// Pass onRetry from a Client Component, e.g. error.tsx's retry()
export const ErrorState = ({
  onRetry,
  children = "Couldn't load this right now.",
  className,
}: {
  onRetry?: () => void;
  children?: ReactNode;
  className?: string;
}) => (
  <div
    role="alert"
    className={cn(
      "flex min-h-30 flex-col items-center justify-center gap-3 p-4",
      className,
    )}
  >
    <p className="text-center text-muted">{children}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 cursor-pointer rounded-md border border-line px-4 font-bold transition-colors hover:bg-surface-raised"
      >
        Try again
      </button>
    )}
  </div>
);
