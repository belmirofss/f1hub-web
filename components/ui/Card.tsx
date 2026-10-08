import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type CardProps = ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "section" | "article";
};

export const Card = ({ as: Tag = "div", className, ...props }: CardProps) => (
  <Tag
    className={cn(
      "flex flex-col gap-3 rounded-lg border border-line bg-surface p-4",
      className,
    )}
    {...props}
  />
);

// Whole-card link with a chevron: "Teammate battle >", "Circuit guide >"
export const LinkCard = ({
  href,
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link>) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-surface-raised",
      className,
    )}
    {...props}
  >
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>
    <ChevronRight
      aria-hidden
      size={18}
      className="shrink-0 text-muted"
      strokeWidth={2}
    />
  </Link>
);

// "Results" style link in a card header. The hit area reaches past the text
// so it's easy to tap without making the header taller.
export const InlineLink = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link>) => (
  <Link
    className={cn(
      "relative text-[13px] font-bold text-accent after:absolute after:-inset-x-2 after:-inset-y-3 hover:underline",
      className,
    )}
    {...props}
  />
);

// Thin vertical bar in the team's colour, next to a driver or team name
export const TeamBar = ({
  color,
  height = 26,
  className,
}: {
  color: string;
  height?: number;
  className?: string;
}) => (
  <span
    aria-hidden
    className={cn("block w-1 shrink-0 rounded-[2px]", className)}
    style={{ backgroundColor: color, height }}
  />
);

type IconButtonProps = {
  label: string;
  children: ReactNode;
  bordered?: boolean;
  className?: string;
} & (
  { href: string; onClick?: never } | { href?: never; onClick?: () => void }
);

// 44px square button or link holding one icon: settings, share, back
export const IconButton = ({
  label,
  children,
  bordered = true,
  className,
  href,
  onClick,
}: IconButtonProps) => {
  const classes = cn(
    "flex size-11 shrink-0 items-center justify-center rounded-md text-text transition-colors hover:bg-surface-raised",
    bordered && "border border-line",
    className,
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(classes, "cursor-pointer")}
    >
      {children}
    </button>
  );
};
