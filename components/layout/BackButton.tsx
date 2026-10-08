"use client";

import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

// Set once the visitor has moved between pages inside the site, so Back
// knows that history.back() stays on F1HUB.
let navigatedInApp = false;

// Mounted once in the root layout
export const HistoryTracker = () => {
  const pathname = usePathname();
  const first = useRef(pathname);

  useEffect(() => {
    if (pathname !== first.current) navigatedInApp = true;
  }, [pathname]);

  return null;
};

const canGoBack = () => {
  // The Navigation API only lists same-origin entries, so this also covers
  // a reload after moving around the site. Not every browser has it yet.
  const navigation = (window as { navigation?: { canGoBack?: boolean } })
    .navigation;
  return navigatedInApp || navigation?.canGoBack === true;
};

// Goes back like the browser when the previous page is ours, otherwise to a
// sensible parent (someone landing on a driver page from Google goes to
// Standings). It's a real link, so it also works before hydration.
export const BackButton = ({
  fallbackHref,
  className,
}: {
  fallbackHref: string;
  className?: string;
}) => {
  const router = useRouter();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const modified =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (modified || event.button !== 0 || !canGoBack()) return;
    event.preventDefault();
    router.back();
  };

  return (
    <Link
      href={fallbackHref}
      onClick={onClick}
      aria-label="Back"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-md text-text transition-colors hover:bg-surface-raised",
        className,
      )}
    >
      <ChevronLeft aria-hidden size={22} strokeWidth={2} />
    </Link>
  );
};
