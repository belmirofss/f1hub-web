// Ported from the app's src/helpers/time.ts, with Intl.DateTimeFormat in
// place of moment-timezone. Strings match the app: "FRI 09", "09:00",
// "9:00 AM", "09 OCT", "09–11 OCT", "GMT-3".
//
// Leaving out `timeZone` formats in the runtime's zone: the viewer's in the
// browser, the server's (UTC on Vercel) during SSR. Times in the viewer's
// zone are formatted on the client only, by components/time/LocalTime.

export const HOUR = 3600000;

// The browser's IANA zone ("America/Sao_Paulo")
export const localTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

// The API sends UTC dates ("2026-10-11") and times ("12:00:00Z")
export const toDate = (date: string, time?: string) =>
  new Date(time ? `${date}T${time}` : `${date}T00:00:00Z`);

// Building a formatter is slow, so keep one per set of options
const formatters = new Map<string, Intl.DateTimeFormat>();

const getParts = (
  date: Date | number,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
) => {
  const key = JSON.stringify([options, timeZone]);
  let formatter = formatters.get(key);
  if (!formatter) {
    // en-US: "Sep", not en-GB's "Sept", like moment
    formatter = new Intl.DateTimeFormat("en-US", { ...options, timeZone });
    formatters.set(key, formatter);
  }
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  formatter
    .formatToParts(date)
    .forEach((part) => (parts[part.type] = part.value));
  return parts;
};

// "09:00" or "9:00 AM"
export const formatClock = (
  date: Date | number,
  clock24: boolean,
  timeZone?: string,
) => {
  if (clock24) {
    const { hour, minute } = getParts(
      date,
      { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
      timeZone,
    );
    return `${hour}:${minute}`;
  }
  const { hour, minute, dayPeriod } = getParts(
    date,
    { hour: "numeric", minute: "2-digit", hourCycle: "h12" },
    timeZone,
  );
  return `${hour}:${minute} ${dayPeriod?.toUpperCase()}`;
};

// "FRI 09"
export const formatDay = (date: Date | number, timeZone?: string) => {
  const { weekday, day } = getParts(
    date,
    { weekday: "short", day: "2-digit" },
    timeZone,
  );
  return `${weekday} ${day}`.toUpperCase();
};

// "FRI"
export const formatWeekday = (date: Date | number, timeZone?: string) =>
  getParts(date, { weekday: "short" }, timeZone).weekday!.toUpperCase();

// "09 OCT"
export const formatShortDate = (date: Date | number, timeZone?: string) => {
  const { day, month } = getParts(
    date,
    { day: "2-digit", month: "short" },
    timeZone,
  );
  return `${day} ${month}`.toUpperCase();
};

// "9 Oct 2026", for birthdays and other plain dates
export const formatLongDate = (date: Date | number, timeZone?: string) => {
  const { day, month, year } = getParts(
    date,
    { day: "numeric", month: "short", year: "numeric" },
    timeZone,
  );
  return `${day} ${month} ${year}`;
};

// "09–11 OCT", or "30 OCT–01 NOV" across months
export const formatDateRange = (
  start: Date | number,
  end: Date | number,
  timeZone?: string,
) => {
  const a = getParts(
    start,
    { day: "2-digit", month: "short", year: "numeric" },
    timeZone,
  );
  const b = getParts(
    end,
    { day: "2-digit", month: "short", year: "numeric" },
    timeZone,
  );
  const range =
    a.month === b.month && a.year === b.year
      ? `${a.day}–${b.day} ${b.month}`
      : `${a.day} ${a.month}–${b.day} ${b.month}`;
  return range.toUpperCase();
};

// Minutes ahead of UTC in a zone at a given moment (-180 in São Paulo)
export const utcOffsetMinutes = (
  timeZone?: string,
  at: Date | number = Date.now(),
) => {
  const time = typeof at === "number" ? at : at.getTime();
  const p = getParts(
    time,
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    },
    timeZone,
  );
  const wall = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return Math.round((wall - Math.floor(time / 1000) * 1000) / 60000);
};

// "GMT-3", "GMT+0", "GMT+5:30"
export const utcOffsetLabel = (
  timeZone?: string,
  at: Date | number = Date.now(),
) => {
  const offset = utcOffsetMinutes(timeZone, at);
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `GMT${offset < 0 ? "-" : "+"}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
};

// Midnight of the day `date` falls on in a zone, as a timestamp
export const startOfDay = (date: Date | number, timeZone?: string) => {
  const { year, month, day } = getParts(
    date,
    { year: "numeric", month: "2-digit", day: "2-digit" },
    timeZone,
  );
  const midnight = Date.UTC(Number(year), Number(month) - 1, Number(day));
  // The offset at midnight can differ from the one at `date` on DST days
  const guess = midnight - utcOffsetMinutes(timeZone, midnight) * 60000;
  return midnight - utcOffsetMinutes(timeZone, guess) * 60000;
};

// Whole years between two dates, for a driver's age
export const yearsBetween = (from: string, to: Date | number = Date.now()) => {
  const start = toDate(from);
  const end = new Date(to);
  const years = end.getUTCFullYear() - start.getUTCFullYear();
  const before =
    end.getUTCMonth() < start.getUTCMonth() ||
    (end.getUTCMonth() === start.getUTCMonth() &&
      end.getUTCDate() < start.getUTCDate());
  return before ? years - 1 : years;
};

export const splitDuration = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
};
