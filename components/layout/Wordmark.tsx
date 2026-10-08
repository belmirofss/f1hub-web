import Link from "next/link";
import { cn } from "@/lib/cn";

// "F1HUB" in the app's slanted black weight, linking home
export const Wordmark = ({ className }: { className?: string }) => (
  <Link
    href="/"
    aria-label="F1HUB home"
    className={cn(
      "inline-block -skew-x-[10deg] text-[26px] leading-9 font-black tracking-[-0.5px]",
      className,
    )}
  >
    F1<span className="text-accent">HUB</span>
  </Link>
);
