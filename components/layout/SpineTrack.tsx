"use client";

import { useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, PointerEvent } from "react";
import Link from "next/link";
import { LocalTime, TrackTime } from "@/components/time/LocalTime";
import { cn } from "@/lib/cn";

export type SpineRound = {
  round: string;
  // "MAL"
  code: string;
  href: string;
  raceName: string;
  // "Marina Bay Street Circuit, Marina Bay"
  venue: string;
  // "11 OCT", the race day at the track
  day: string;
  sprint: boolean;
  state: "done" | "next" | "future";
  // "Round 16, Malaysia, won by Verstappen"
  label: string;
  winner?: { name: string; team: string; color: string; grid: string };
  // The next session, on the round it belongs to
  nextSession?: { name: string; start: string; hasTime: boolean };
};

const POPOVER_WIDTH = 248;
const EDGE = 8;

type Open = { index: number; left: number; top: number };

const CELL_STYLES: Record<SpineRound["state"], string> = {
  done: "bg-surface-raised text-text hover:bg-line",
  next: "bg-accent text-on-accent hover:brightness-110",
  future: "text-muted hover:bg-surface-raised hover:text-text",
};

const Popover = ({ round, open }: { round: SpineRound; open: Open }) => (
  // Fixed, so the strip's scroll box doesn't clip it. The cell's accessible
  // name already says what matters, so screen readers skip this.
  <div
    aria-hidden
    className="pointer-events-none fixed z-40 flex flex-col gap-1.5 border border-line bg-surface px-3.5 py-3 shadow-[0_16px_30px_rgba(26,24,20,0.18)]"
    style={{ left: open.left, top: open.top, width: POPOVER_WIDTH }}
  >
    <span className="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
      R{round.round} · {round.day}
      {round.sprint && " · Sprint"}
    </span>
    <span className="text-sm leading-tight font-bold">{round.raceName}</span>
    <span className="text-xs leading-snug text-soft">{round.venue}</span>
    {round.winner ? (
      <span className="flex items-center gap-2 text-[13px] text-soft">
        <span
          className="h-3.5 w-1 shrink-0"
          style={{ backgroundColor: round.winner.color }}
        />
        <span>
          <span className="font-semibold text-text">{round.winner.name}</span>{" "}
          won from {round.winner.grid}
        </span>
      </span>
    ) : round.nextSession ? (
      <span className="font-mono text-[11px] tracking-[0.06em] uppercase">
        <span className="font-bold text-accent-ink">Next</span>{" "}
        {round.nextSession.name} ·{" "}
        {round.nextSession.hasTime ? (
          <LocalTime value={round.nextSession.start} format="dayClock" />
        ) : (
          // Only the date is known, and the API gives it in UTC
          <TrackTime
            value={round.nextSession.start}
            format="day"
            timeZone="UTC"
          />
        )}
      </span>
    ) : null}
  </div>
);

// The cells and their popover. The server component works out each round;
// this part shows the popover on hover or keyboard focus and keeps the
// selected (or next) round in view when the strip scrolls.
export const SpineTrack = ({
  rounds,
  selected,
  focus,
}: {
  rounds: SpineRound[];
  selected?: string;
  focus?: string;
}) => {
  const track = useRef<HTMLOListElement>(null);
  const [open, setOpen] = useState<Open | null>(null);

  // Centres the round on the first render, and later only when a new
  // selection is out of view, so the strip doesn't move under the pointer
  const centred = useRef(false);
  useEffect(() => {
    const list = track.current;
    const cell = focus
      ? list?.querySelector<HTMLElement>(`[data-round="${focus}"]`)
      : null;
    if (!list || !cell) return;
    const start = cell.offsetLeft - list.offsetLeft;
    const end = start + cell.offsetWidth;
    const inView =
      start >= list.scrollLeft && end <= list.scrollLeft + list.clientWidth;
    if (centred.current && inView) return;
    centred.current = true;
    list.scrollLeft = start - (list.clientWidth - cell.offsetWidth) / 2;
  }, [focus]);

  // A scroll anywhere would leave the popover behind
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(null);
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const show = (index: number, cell: HTMLElement) => {
    const rect = cell.getBoundingClientRect();
    const centre = rect.left + rect.width / 2;
    setOpen({
      index,
      left: Math.max(
        EDGE,
        Math.min(
          centre - POPOVER_WIDTH / 2,
          window.innerWidth - POPOVER_WIDTH - EDGE,
        ),
      ),
      top: rect.bottom + 6,
    });
  };
  const hide = () => setOpen(null);

  return (
    <>
      <ol
        ref={track}
        className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-4 py-2.5 md:gap-[3px] md:px-0 md:py-3"
      >
        {rounds.map((round, index) => {
          const isSelected = round.round === selected;
          return (
            <li
              key={round.round}
              data-round={round.round}
              className="flex w-14 shrink-0 md:w-auto md:min-w-10 md:flex-1"
            >
              <Link
                href={round.href}
                aria-label={`${round.label}${round.sprint ? ", sprint weekend" : ""}`}
                aria-current={isSelected ? "page" : undefined}
                onPointerEnter={(event: PointerEvent<HTMLAnchorElement>) => {
                  if (event.pointerType === "mouse")
                    show(index, event.currentTarget);
                }}
                onPointerLeave={hide}
                // Keyboard focus only: a tap focuses the link too, and the
                // page is about to change anyway
                onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
                  if (event.currentTarget.matches(":focus-visible"))
                    show(index, event.currentTarget);
                }}
                onBlur={hide}
                onKeyDown={(event: KeyboardEvent<HTMLAnchorElement>) => {
                  if (event.key === "Escape") hide();
                }}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-between pb-1.5 transition-colors",
                  CELL_STYLES[round.state],
                  isSelected && "outline-2 -outline-offset-2 outline-text",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-1 w-full",
                    round.state === "next" && "bg-on-accent",
                    round.state === "future" && "bg-line",
                  )}
                  style={
                    round.winner
                      ? { backgroundColor: round.winner.color }
                      : undefined
                  }
                />
                {round.sprint && (
                  <span
                    aria-hidden
                    className="absolute top-2 right-1 size-1.5 bg-sprint"
                  />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "font-mono text-[10px] leading-none md:text-[9px]",
                    round.state === "done" && "text-muted",
                  )}
                >
                  R{round.round}
                </span>
                <span
                  aria-hidden
                  className="text-[13px] leading-none font-bold tracking-[0.02em] md:text-[11px]"
                >
                  {round.code}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {open && rounds[open.index] && (
        <Popover round={rounds[open.index]} open={open} />
      )}
    </>
  );
};
