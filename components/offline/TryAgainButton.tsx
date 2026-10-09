"use client";

import { primaryButton } from "@/components/layout/StatusScreen";
import { cn } from "@/lib/cn";

// The service worker shows /offline at the address that failed, so a reload
// asks for that page again
export const TryAgainButton = () => (
  <button
    type="button"
    onClick={() => window.location.reload()}
    className={cn(primaryButton, "w-full sm:w-auto")}
  >
    Try again
  </button>
);
