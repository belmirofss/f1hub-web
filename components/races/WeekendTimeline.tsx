"use client";

import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { useNow } from "@/components/time/useNow";
import { cn } from "@/lib/cn";
import { getWeekendSpan } from "@/lib/domain/sessions";
import { HOUR, formatWeekday } from "@/lib/domain/time";

export type TimelineSession = {
  key: string;
  short: string; // "FP1", "QUALI"
  start: string; // ISO, UTC
};

const DAY = 24 * HOUR;

// Fri–Sun bar with a marker per session, placed by its real start time, and
// a "now" line while the weekend is on. Days depend on the visitor's time
// zone, so the markers fill in after hydration. The sessions table below has
// the same information for screen readers.
export const WeekendTimeline = ({
  sessions,
}: {
  sessions: TimelineSession[];
}) => {
  const now = useNow(60000);
  const starts = sessions.map((session) => Date.parse(session.start));
  const span = now === null ? undefined : { ...getWeekendSpan(starts), now };

  // A weekend that falls on 1 or 5+ days in this time zone doesn't fit the bar
  if (span && (span.days < 2 || span.days > 4)) return null;

  const position = (time: number) =>
    span ? `${((time - span.first) / (span.end - span.first)) * 100}%` : "0";

  return (
    <Card as="section" aria-labelledby="weekend-glance" className="pb-2.5">
      <h2 id="weekend-glance">
        <Label>Weekend at a glance</Label>
      </h2>
      <div aria-hidden className="relative mt-1 h-[76px]">
        <span className="absolute inset-x-0 top-[30px] h-1 rounded-[2px] bg-line" />
        {span && (
          <>
            {Array.from({ length: span.days - 1 }, (_, index) => (
              <span
                key={index}
                className="absolute top-5 h-6 w-px bg-line-dashed"
                style={{ left: `${((index + 1) / span.days) * 100}%` }}
              />
            ))}
            {span.now > span.first && span.now < span.end && (
              <span
                className="absolute top-[18px] h-7 w-0.5 -translate-x-1/2 bg-text"
                style={{ left: position(span.now) }}
              />
            )}
            {sessions.map((session, index) => {
              const isRace = session.key === "race";
              const filled = isRace || starts[index] <= span.now;
              const up = index % 2 === 0;
              return (
                <span
                  key={session.key}
                  className="absolute top-0 -ml-6 flex w-12 flex-col items-center"
                  style={{ left: position(starts[index]) }}
                >
                  <span
                    className={cn(
                      "h-3.5 font-mono text-[9px] font-bold",
                      isRace && "text-accent-ink",
                      !up && "invisible",
                    )}
                  >
                    {session.short}
                  </span>
                  <span
                    className={cn(
                      "mt-[9px] size-3.5 rounded-full",
                      filled
                        ? "bg-accent"
                        : "border-[3px] border-text bg-background",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-1.5 font-mono text-[9px] font-bold",
                      up && "invisible",
                    )}
                  >
                    {session.short}
                  </span>
                </span>
              );
            })}
            <span className="absolute inset-x-0 bottom-0 flex">
              {Array.from({ length: span.days }, (_, index) => (
                <span
                  key={index}
                  className="flex-1 text-center font-mono text-[10px] text-muted"
                >
                  {formatWeekday(span.first + (index + 0.5) * DAY)}
                </span>
              ))}
            </span>
          </>
        )}
      </div>
    </Card>
  );
};
