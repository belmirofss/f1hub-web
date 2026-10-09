import Link from "next/link";
import { cn } from "@/lib/cn";

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
