import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

// A champion in the team's colour: the mono meta line, the name as a
// headline, a one-line summary and a link. The archive's detail panel and
// the season pages' champion card. Without a colour it's a plain block, or
// the dashed one of the season under way.
export const ChampionBlock = ({
  meta,
  headline,
  summary,
  link,
  color,
  live,
  className,
}: {
  // "1988 · McLaren"
  meta: ReactNode;
  headline: string;
  summary: ReactNode;
  link?: { href: string; label: string };
  // The team colour and its readable text
  color?: { background: string; text: string };
  live?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col gap-1.5 p-4 lg:p-[22px] [&_a:focus-visible]:outline-current",
      !color &&
        (live ? "border-2 border-dashed border-accent" : "bg-surface-raised"),
      className,
    )}
    style={
      color ? { backgroundColor: color.background, color: color.text } : {}
    }
  >
    <p
      className={cn(
        "font-mono text-[10px] tracking-[0.14em] uppercase lg:text-[11px]",
        live && "font-bold text-accent-ink",
      )}
    >
      {meta}
    </p>
    <p className="font-display text-[28px] leading-[0.95] font-black tracking-[0.005em] break-words uppercase lg:text-[40px] lg:leading-[0.9]">
      {headline}
    </p>
    <p className="text-[13px] font-semibold lg:text-sm">{summary}</p>
    {link && (
      <Link
        href={link.href}
        className="mt-1 flex min-h-11 items-center self-start text-sm font-extrabold underline-offset-2 hover:underline lg:mt-2"
      >
        {link.label}&nbsp;→
      </Link>
    )}
  </div>
);
