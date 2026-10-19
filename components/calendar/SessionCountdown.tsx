"use client";

import { useNow } from "@/components/time/useNow";
import { cn } from "@/lib/cn";
import { getWeekendState } from "@/lib/domain/sessions";
import { splitDuration } from "@/lib/domain/time";
import { plural } from "@/lib/metadata";

export type CountdownSession = {
  name: string; // "Sprint"
  start: number;
  end: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

// "SPRINT IN 16:34:12" on the next round's poster, "3D 04:10" while it's
// more than a day away and LIVE while a session runs. Renders at the
// server's request time until hydration, then ticks every second without
// announcing it.
export const SessionCountdown = ({
  sessions,
  serverNow,
  className,
}: {
  sessions: CountdownSession[];
  serverNow: number;
  className?: string;
}) => {
  const now = useNow(1000) ?? serverNow;
  const { live, next } = getWeekendState(sessions, now);

  if (live !== undefined) {
    return (
      <span className={cn("flex flex-col", className)}>
        <span className="text-xs font-bold uppercase">
          {sessions[live].name}
        </span>
        <span className="flex items-center gap-2 font-mono text-[28px] leading-none font-bold lg:text-[40px]">
          <span
            aria-hidden
            className="size-3 rounded-full bg-on-accent motion-safe:animate-lamp-flash"
          />
          LIVE
        </span>
      </span>
    );
  }

  if (next === undefined) return null;
  const session = sessions[next];
  const { days, hours, minutes, seconds } = splitDuration(session.start - now);
  const time =
    days > 0
      ? `${days}D ${pad(hours)}:${pad(minutes)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const spoken =
    days > 0
      ? `${plural(days, "day")}, ${plural(hours, "hour")}`
      : `${plural(hours, "hour")}, ${plural(minutes, "minute")}`;

  // No aria-label: it would replace the time for some screen readers
  return (
    <span
      role="timer"
      aria-live="off"
      className={cn("flex flex-col", className)}
    >
      <span className="text-xs font-bold uppercase">{session.name} in</span>
      <span className="sr-only"> {spoken}</span>
      <span
        aria-hidden
        className="font-mono text-[28px] leading-none font-bold tabular-nums lg:text-[40px]"
      >
        {time}
      </span>
    </span>
  );
};
