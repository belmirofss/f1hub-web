import Link from "next/link";
import { cn } from "@/lib/cn";

export type Tab = {
  href: string;
  label: string;
  // Not available yet (no results before the race, no OpenF1 data, ...)
  disabled?: boolean;
};

type Props = {
  tabs: Tab[];
  // href of the current tab
  value: string;
  // Accessible name: "Weekend sections"
  label: string;
  // "caps": mono caps labels. "text": plain text links, like the race
  // weekend's "Race  Sprint  Qualifying"
  variant?: "caps" | "text";
  className?: string;
};

// Underlined tabs rendered as links: "Schedule  Race  Sprint  Qualifying".
// Scrolls sideways when they don't fit (sprint weekends with Analysis and Radio).
export const Tabs = ({
  tabs,
  value,
  label,
  variant = "caps",
  className,
}: Props) => (
  <nav
    aria-label={label}
    className={cn(
      "no-scrollbar flex overflow-x-auto border-b border-line",
      className,
    )}
  >
    {tabs.map((tab) => {
      const selected = tab.href === value;
      const classes = cn(
        "-mb-px flex min-h-11 shrink-0 items-center border-transparent px-3 whitespace-nowrap",
        variant === "caps"
          ? "border-b-[3px] font-mono text-xs tracking-[0.08em] uppercase"
          : "border-b-2 text-sm font-semibold",
        selected && "border-accent text-text",
        selected && variant === "caps" && "font-bold",
        !selected && "text-muted",
        !selected && variant === "caps" && "font-medium",
      );

      if (tab.disabled) {
        return (
          <span
            key={tab.href}
            aria-disabled="true"
            className={cn(classes, "text-subtle")}
          >
            {tab.label}
          </span>
        );
      }

      return (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={selected ? "page" : undefined}
          className={cn(classes, !selected && "hover:text-text")}
        >
          {tab.label}
        </Link>
      );
    })}
  </nav>
);
