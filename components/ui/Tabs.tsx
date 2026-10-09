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
  className?: string;
};

// Underlined tabs rendered as links: "Schedule  Race  Sprint  Qualifying".
// Scrolls sideways when they don't fit (sprint weekends with Analysis and Radio).
export const Tabs = ({ tabs, value, label, className }: Props) => (
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
        "-mb-px flex min-h-11 shrink-0 items-center border-b-[3px] border-transparent px-3 font-mono text-xs tracking-[0.08em] whitespace-nowrap uppercase",
        selected
          ? "border-accent font-bold text-text"
          : "font-medium text-muted",
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
