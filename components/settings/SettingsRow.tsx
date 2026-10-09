import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EXTERNAL_LINK } from "@/lib/links";

type Props = {
  icon: ReactNode;
  label: string;
  // Muted text on the right: "Jolpica F1 API", "Link copied"
  value?: ReactNode;
  // The accent icon colour for the row that matters most
  highlight?: boolean;
} & (
  | { as: "a"; href: string; onClick?: never; disabled?: never }
  | { as: "button"; href?: never; onClick?: () => void; disabled?: boolean }
);

// One row of the Settings link list: icon, label and an optional value
export const SettingsRow = ({
  as,
  icon,
  label,
  value,
  highlight,
  href,
  onClick,
  disabled,
}: Props) => {
  const content = (
    <>
      <span
        className={cn(
          "flex shrink-0",
          highlight ? "text-accent" : "text-muted",
        )}
      >
        {icon}
      </span>
      <span className="flex-1 font-semibold">{label}</span>
      {value && <span className="text-[13px] text-muted">{value}</span>}
    </>
  );
  const classes =
    "flex min-h-[52px] w-full items-center gap-3 border-b border-line-soft px-3.5 text-left transition-colors last:border-b-0 enabled:cursor-pointer [&:not(:disabled)]:hover:bg-surface-raised";

  if (as === "a") {
    return (
      // Every link row goes to another site
      <a href={href} {...EXTERNAL_LINK} className={classes}>
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {content}
    </button>
  );
};
