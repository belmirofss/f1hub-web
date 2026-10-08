"use client";

import { useSettings } from "@/components/settings/SettingsProvider";
import { cn } from "@/lib/cn";
import {
  formatClock,
  formatDateRange,
  formatDay,
  formatDayDate,
  formatShortDate,
  utcOffsetLabel,
} from "@/lib/domain/time";
import { useHydrated, useNow } from "./useNow";

// "09:00", "FRI 09", "FRI 09 09:00", "FRI 09 OCT", "09 OCT", "09–11 OCT"
export type TimeFormat =
  "clock" | "day" | "dayClock" | "dayDate" | "shortDate" | "range";

// What a Server Component can pass: a Date, a timestamp or an ISO string
export type TimeValue = Date | number | string;

export type TimeProps = {
  value: TimeValue;
  // Last day of the range, for format="range"
  end?: TimeValue;
  format?: TimeFormat;
  className?: string;
};

const formatTime = (
  format: TimeFormat,
  date: Date,
  end: Date,
  clock24: boolean,
  timeZone?: string,
) => {
  switch (format) {
    case "clock":
      return formatClock(date, clock24, timeZone);
    case "day":
      return formatDay(date, timeZone);
    case "dayClock":
      return `${formatDay(date, timeZone)} ${formatClock(date, clock24, timeZone)}`;
    case "dayDate":
      return formatDayDate(date, timeZone);
    case "shortDate":
      return formatShortDate(date, timeZone);
    case "range":
      return formatDateRange(date, end, timeZone);
  }
};

// As wide as the real text in a monospaced font, so nothing moves when the
// time fills in. Invisible, so there's no flash of dashes either.
const PLACEHOLDERS: Record<TimeFormat, string> = {
  clock: "00:00",
  day: "MON 00",
  dayClock: "MON 00 00:00",
  dayDate: "MON 00 MON",
  shortDate: "00 MON",
  range: "00–00 MON",
};

const Placeholder = ({ text }: { text: string }) => (
  <span aria-hidden className="invisible">
    {text}
  </span>
);

// A time in the viewer's time zone. The server doesn't know that zone, so it
// sends a blank of the same width and the browser fills it in after hydration.
export const LocalTime = ({
  value,
  end,
  format = "clock",
  className,
}: TimeProps) => {
  const { clock24 } = useSettings();
  const hydrated = useHydrated();
  const date = new Date(value);

  return (
    <time
      dateTime={date.toISOString()}
      className={cn("whitespace-nowrap", className)}
    >
      {hydrated ? (
        formatTime(format, date, new Date(end ?? value), clock24)
      ) : (
        <Placeholder text={PLACEHOLDERS[format]} />
      )}
    </time>
  );
};

// A time in a fixed zone (the circuit's). The text doesn't depend on the
// viewer, so the server renders it and search engines see it.
export const TrackTime = ({
  value,
  end,
  format = "clock",
  timeZone,
  className,
}: TimeProps & { timeZone: string }) => {
  const { clock24 } = useSettings();
  const date = new Date(value);

  return (
    <time
      dateTime={date.toISOString()}
      className={cn("whitespace-nowrap", className)}
    >
      {formatTime(format, date, new Date(end ?? value), clock24, timeZone)}
    </time>
  );
};

// "GMT-3". Without a zone it's the viewer's offset, filled in after
// hydration. Pass `at` (the session) when DST could change the offset before
// then; with both a zone and `at` the text is fixed, so the server renders it.
export const UtcOffset = ({
  timeZone,
  at,
  className,
}: {
  timeZone?: string;
  at?: TimeValue;
  className?: string;
}) => {
  // Without `at`, follow the clock so a DST change shows up in an open tab
  const now = useNow(60000);
  const when = at === undefined ? now : new Date(at);
  const fixed = timeZone !== undefined && at !== undefined;

  return (
    <span className={cn("whitespace-nowrap", className)}>
      {when !== null && (fixed || now !== null) ? (
        utcOffsetLabel(timeZone, when)
      ) : (
        <Placeholder text="GMT+0" />
      )}
    </span>
  );
};
