import Link from "next/link";
import { cn } from "@/lib/cn";

// The app icon drawn in the page, like the one on the home screen: the
// wordmark on a paper tile. Settings and the install prompt show it.
export const AppMark = ({ size = "lg" }: { size?: "md" | "lg" }) => (
  <span
    aria-hidden
    className={cn(
      "flex shrink-0 items-center justify-center border border-line bg-background font-display font-black",
      size === "lg" ? "size-14 text-lg" : "size-12 text-base",
    )}
  >
    <span className="-skew-x-[10deg]">
      F1<span className="text-accent-ink">HUB</span>
    </span>
  </span>
);

// "F1HUB" in the slanted display face, linking home
export const Wordmark = ({ className }: { className?: string }) => (
  <Link
    href="/"
    aria-label="F1HUB home"
    className={cn(
      "inline-block -skew-x-[10deg] font-display text-[30px] leading-9 font-black tracking-[0.01em]",
      className,
    )}
  >
    F1<span className="text-accent-ink">HUB</span>
  </Link>
);
