"use client";

import { cn } from "@/lib/cn";
import { splitDuration } from "@/lib/domain/time";
import type { TimeValue } from "./LocalTime";
import { useNow } from "./useNow";

const pad = (n: number) => String(n).padStart(2, "0");

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

// Days / hours / minutes to the race start, then "Lights out" once it has
// started. The tiles stay blank until hydration, as the server can't know
// how long is left when the page is viewed.
export const Countdown = ({
  target,
  className,
}: {
  target: TimeValue;
  className?: string;
}) => {
  const now = useNow(1000);
  const start = new Date(target).getTime();

  if (now !== null && now >= start) {
    return (
      <p
        className={cn(
          "rounded-md bg-accent/12 p-3 text-base font-bold",
          className,
        )}
      >
        Lights out — the race is underway
      </p>
    );
  }

  const { days, hours, minutes } = splitDuration(
    now === null ? 0 : start - now,
  );
  const cells = [
    { value: days, label: "DAYS" },
    { value: hours, label: "HRS" },
    { value: minutes, label: "MIN" },
  ];

  return (
    <div
      role="timer"
      aria-label={
        now === null
          ? "Race countdown"
          : `Race starts in ${plural(days, "day")}, ${plural(hours, "hour")} and ${plural(minutes, "minute")}`
      }
      className={cn("flex gap-2", className)}
    >
      {cells.map((cell) => (
        <div
          key={cell.label}
          aria-hidden
          className="flex flex-1 flex-col items-center rounded-md bg-background py-2.5"
        >
          <span
            className={cn(
              "font-mono text-[34px]/[38px] font-bold",
              now === null && "invisible",
            )}
          >
            {pad(cell.value)}
          </span>
          <span className="font-mono text-[10px] tracking-[1.5px] text-muted">
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  );
};
