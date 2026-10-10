"use client";

import { useHydrated, useNow } from "@/components/time/useNow";
import { useSessionTimeZone } from "@/components/time/TimeZoneMode";
import { cn } from "@/lib/cn";
import {
  getWeekendSpan,
  getWeekendState,
  type SessionKey,
} from "@/lib/domain/sessions";
import {
  HOUR,
  formatDay,
  formatWeekday,
  splitDuration,
  startOfDay,
} from "@/lib/domain/time";

// The hero's moving parts: the start lights, the "NEXT · SPRINT" line, the
// countdown and the weekend timeline. They follow the clock in the browser,
// and render at the server's request time until hydration so the page
// arrives complete.

export type WeekendSession = {
  key: SessionKey;
  name: string; // "Sprint Qualifying"
  code: string; // "SQ"
  start: number;
  end: number;
};

type Props = { sessions: WeekendSession[]; serverNow: number };

const DAY = 24 * HOUR;

const useWeekend = ({ sessions, serverNow }: Props) => {
  const now = useNow(60000) ?? serverNow;
  return { now, ...getWeekendState(sessions, now) };
};

const Lamp = ({ lit, flash }: { lit: boolean; flash: boolean }) => (
  <span
    className={cn(
      "size-6 rounded-full md:size-7 lg:size-[34px]",
      lit ? "bg-lamp shadow-[0_0_18px_rgba(255,43,31,0.75)]" : "bg-lamp-off",
      flash && "motion-safe:animate-lamp-flash",
    )}
  />
);

// One pod of two lamps per session, lit once the session is over. A live
// session's lamps flash. Decorative, with a count for screen readers.
export const StartLights = (props: Props) => {
  const { sessions } = props;
  const { done, live } = useWeekend(props);

  return (
    <div
      role="img"
      aria-label={`${done} of ${sessions.length} sessions done${live === undefined ? "" : `, ${sessions[live].name} live`}`}
      className="flex gap-2 lg:gap-3.5"
    >
      {sessions.map((session, index) => {
        const lit = index < done || index === live;
        const flash = index === live;
        return (
          <div
            key={session.key}
            className="flex flex-1 flex-col items-center gap-1.5 bg-gantry p-1.5 md:max-w-[58px] lg:w-[58px] lg:flex-none lg:gap-2 lg:p-2"
          >
            <Lamp lit={lit} flash={flash} />
            <Lamp lit={lit} flash={flash} />
            <span className="font-mono text-[9px] tracking-[0.06em] text-gantry-ink">
              {session.code}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// "NEXT · SPRINT · ROUND 17", "LIVE · QUALIFYING · ROUND 17"
export const WeekendLabel = ({
  round,
  ...props
}: Props & { round: string }) => {
  const { sessions } = props;
  const { live, next } = useWeekend(props);
  const status =
    live !== undefined
      ? `Live · ${sessions[live].name}`
      : next !== undefined
        ? `Next · ${sessions[next].name}`
        : "Chequered flag";

  return (
    <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-accent-ink uppercase lg:text-[13px] lg:tracking-[0.14em]">
      {status} · Round {round}
    </p>
  );
};

const pad = (n: number) => String(n).padStart(2, "0");

const Digits = ({ value, unit }: { value: number; unit: string }) => (
  <span className="flex flex-col items-center">
    <span className="font-mono text-[84px] leading-[0.85] font-bold tracking-[-0.04em] tabular-nums lg:text-[132px]">
      {pad(value)}
    </span>
    <span className="font-mono text-[11px] tracking-[0.2em] text-muted lg:text-xs">
      {unit}
    </span>
  </span>
);

// Hours and minutes to the next session, or days and hours while it's more
// than a day away. LIVE while a session runs. It ticks every minute without
// announcing it: the label stays put and the session list has the times.
export const WeekendCountdown = (props: Props) => {
  const { sessions } = props;
  const { now, live, next } = useWeekend(props);

  if (live !== undefined) {
    return (
      <p className="flex items-center gap-3 font-mono text-[84px] leading-[0.85] font-bold tracking-[-0.04em] text-accent-ink lg:text-[132px]">
        <span
          aria-hidden
          className="size-4 rounded-full bg-accent motion-safe:animate-lamp-flash lg:size-6"
        />
        LIVE
        <span className="sr-only">: {sessions[live].name}</span>
      </p>
    );
  }

  if (next === undefined) {
    return (
      <p className="display-title text-[40px] lg:text-[64px]">Race over</p>
    );
  }

  const session = sessions[next];
  const { days, hours, minutes } = splitDuration(session.start - now);
  const [first, second] =
    days > 0
      ? [
          { value: days, unit: "DAYS" },
          { value: hours, unit: "HRS" },
        ]
      : [
          { value: hours, unit: "HRS" },
          { value: minutes, unit: "MIN" },
        ];

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Countdown to ${session.name}`}
      className="flex items-end gap-1 lg:gap-1.5"
    >
      <span className="sr-only">
        {first.value} {first.unit.toLowerCase()}, {second.value}{" "}
        {second.unit.toLowerCase()}
      </span>
      <span aria-hidden className="contents">
        <Digits {...first} />
        <span className="pb-[18px] font-mono text-[64px] leading-[0.9] text-accent-ink lg:pb-[22px] lg:text-[100px]">
          :
        </span>
        <Digits {...second} />
      </span>
    </div>
  );
};

// The weekend as a bar from Friday's midnight to Sunday's, in the zone the
// My time / Track toggle has picked: day separators, a block per session at
// its real start and length (done ones muted, the next one vermilion) and a
// NOW line. Decorative: the session list under it is the text version. It
// needs the viewer's zone, so it fills in after hydration.
export const WeekendTimeline = (props: Props) => {
  const { sessions } = props;
  const hydrated = useHydrated();
  const timeZone = useSessionTimeZone();
  const { now, done, live, next } = useWeekend(props);

  const span = getWeekendSpan(
    sessions.map((session) => session.start),
    timeZone,
  );
  const length = span.end - span.first;
  const at = (time: number) => `${((time - span.first) / length) * 100}%`;
  // Midnight of each day, whatever DST does to its length
  const days = Array.from({ length: span.days }, (_, index) =>
    startOfDay(span.first + (index + 0.5) * DAY, timeZone),
  );
  const nowInside = now > span.first && now < span.end;

  return (
    <div
      aria-hidden
      className="relative h-[52px] border-y border-line md:h-[104px]"
    >
      {hydrated && (
        <>
          {days.map((day, index) => (
            <span key={day}>
              {index > 0 && (
                <span
                  className="absolute inset-y-0 border-l border-dashed border-line-dashed"
                  style={{ left: at(day) }}
                />
              )}
              <span
                className="absolute bottom-0.5 pl-0.5 font-mono text-[9px] text-muted md:top-2.5 md:bottom-auto md:pl-2 md:text-[11px]"
                style={{ left: at(day) }}
              >
                <span className="md:hidden">
                  {formatWeekday(day, timeZone)}
                </span>
                <span className="max-md:hidden">
                  {formatDay(day, timeZone)}
                </span>
              </span>
            </span>
          ))}
          <span className="absolute inset-x-0 top-[25px] h-0.5 bg-line md:top-[62px]" />
          {nowInside && (
            <span
              className="absolute top-[25px] left-0 h-0.5 bg-accent md:top-[62px]"
              style={{ width: at(now) }}
            />
          )}
          {sessions.map((session, index) => {
            const isDone = index < done;
            const isNext = index === next || index === live;
            return (
              <span key={session.key}>
                <span
                  className={cn(
                    "absolute top-[34px] font-mono text-[11px] font-bold whitespace-nowrap max-md:hidden",
                    isDone ? "text-muted" : isNext && "text-accent-ink",
                  )}
                  style={{ left: at(session.start) }}
                >
                  {session.code}
                </span>
                <span
                  className={cn(
                    "absolute top-[19px] h-3.5 min-w-2.5 md:top-[56px]",
                    isDone
                      ? "bg-line-dashed"
                      : isNext
                        ? "bg-accent"
                        : "bg-text",
                    index === live && "motion-safe:animate-lamp-flash",
                  )}
                  style={{
                    left: at(session.start),
                    width: `${((session.end - session.start) / length) * 100}%`,
                  }}
                />
              </span>
            );
          })}
          {nowInside && (
            <>
              <span
                className="absolute top-2 bottom-2 border-l-2 border-accent-ink md:top-[26px] md:bottom-1.5"
                style={{ left: at(now) }}
              />
              <span
                className="absolute top-[82px] pl-1.5 font-mono text-[10px] font-bold text-accent-ink max-md:hidden"
                style={{ left: at(now) }}
              >
                NOW
              </span>
            </>
          )}
        </>
      )}
    </div>
  );
};
