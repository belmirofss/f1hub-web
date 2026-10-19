"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/cn";

// A pulse over the enclosing <Link> while the page it opens is still on its
// way from the server, so a click answers straight away. Always rendered and
// only its opacity changes, so nothing shifts; it waits a beat before
// showing, so quick navigations don't flash it. The link needs a position
// (relative or absolute) for it to cover.
export const LinkPending = ({ className }: { className?: string }) => {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity",
        pending ? "opacity-100 delay-100" : "opacity-0",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-[inherit] bg-current/15",
          pending && "motion-safe:animate-pulse",
        )}
      />
    </span>
  );
};
