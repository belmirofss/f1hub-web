// Layout maths for the calendar's views: the posters' summary, the
// timeline's date axis and the month grid.
import type { Constructor, Race } from "@/lib/api/types";
import { getCircuitTimezone } from "./circuits";
import {
  getRaceStart,
  getSessions,
  getWeekendStart,
  type RoundState,
  type Session,
} from "./sessions";
import {
  formatDateRange,
  formatIsoDate,
  formatShortDate,
  toDate,
} from "./time";

const DAY = 24 * 3600000;

// Jolpica's short country names, spelled out for a headline
const COUNTRY_NAMES: Record<string, string> = {
  USA: "United States",
  UK: "Great Britain",
  UAE: "Abu Dhabi",
};

// Where a round is, for the poster's headline: "Singapore", "Hungary". A
// country with more than one round that season gets the city instead:
// "Miami", "Austin", "Las Vegas"; "Barcelona", "Madrid".
export const getPlaceName = (race: Race, races: Race[]) => {
  const { country, locality } = race.Circuit.Location;
  const shared =
    races.filter((other) => other.Circuit.Location.country === country).length >
    1;
  return shared ? locality : (COUNTRY_NAMES[country] ?? country);
};

// "09–11 OCT" at the track, so the server can render it. Without a start
// time only the UTC dates are known.
export const formatWeekendDates = (race: Race) => {
  const zone =
    (race.time && getCircuitTimezone(race.Circuit.circuitId)) || "UTC";
  return formatDateRange(getWeekendStart(race), getRaceStart(race), zone);
};

export const getTeamWins = (rows: RoundState[]) => {
  const wins = new Map<string, { team: Constructor; count: number }>();
  rows.forEach(({ winner }) => {
    if (!winner) return;
    const team = winner.Constructor;
    const entry = wins.get(team.constructorId) ?? { team, count: 0 };
    entry.count++;
    wins.set(team.constructorId, entry);
  });
  return [...wins.values()].sort((x, y) => y.count - x.count);
};

export const countWinners = (rows: RoundState[]) =>
  new Set(rows.flatMap(({ winner }) => winner?.Driver.driverId ?? [])).size;

// Timeline

// Two races closer than this share a stretch of the axis, so the second one
// drops to the other lane
const BACK_TO_BACK_DAYS = 14;
// Gaps this long get a label on the strip
const LONG_GAP_DAYS = 28;

export type TimelineRound = RoundState & {
  // Where race day sits on the axis, 0 to 1
  at: number;
  lane: 0 | 1;
  // Days since the previous race, 0 for the opener
  gap: number;
};

export type TimelineGap = {
  // Midway between the two races, 0 to 1
  at: number;
  weeks: number;
  summer: boolean;
};

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

// Race day at noon UTC, so a tile sits in the middle of its day
const raceDay = (race: Race) => toDate(race.date).getTime() + DAY / 2;

// A real date axis from the first of the opening race's month to the end of
// the finale's month, with each race at its race day. Back-to-backs swap
// lanes, and long gaps (the longest one in July or August is the summer
// break) are labelled.
export const getTimelineLayout = (rows: RoundState[], now: number) => {
  const first = toDate(rows[0].race.date);
  const last = toDate(rows[rows.length - 1].race.date);
  const start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
  const end = Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1);
  const position = (time: number) => (time - start) / (end - start);

  const months: { label: string; at: number }[] = [];
  for (let month = new Date(start); month.getTime() < end;) {
    months.push({
      label: MONTHS[month.getUTCMonth()],
      at: position(month.getTime()),
    });
    month = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1),
    );
  }

  let lane: 0 | 1 = 0;
  const rounds: TimelineRound[] = rows.map((row, index) => {
    const day = raceDay(row.race);
    const gap = index
      ? Math.round((day - raceDay(rows[index - 1].race)) / DAY)
      : 0;
    lane = index && gap < BACK_TO_BACK_DAYS ? (lane === 0 ? 1 : 0) : 0;
    return { ...row, at: position(day), lane, gap };
  });

  const gaps = rounds.flatMap((round, index): TimelineGap[] => {
    if (round.gap < LONG_GAP_DAYS) return [];
    const middle = (raceDay(round.race) + raceDay(rows[index - 1].race)) / 2;
    const month = new Date(middle).getUTCMonth();
    return [
      {
        at: (round.at + rounds[index - 1].at) / 2,
        weeks: Math.round(round.gap / 7),
        summer: month === 6 || month === 7,
      },
    ];
  });
  // Only the longest summer gap is the break
  const summer = gaps
    .filter((gap) => gap.summer)
    .sort((a, b) => b.weeks - a.weeks)[0];
  gaps.forEach((gap) => (gap.summer = gap === summer));

  const today = position(now);
  return {
    months,
    rounds,
    gaps,
    today:
      today >= 0 && today <= 1
        ? { at: today, label: formatShortDate(now, "UTC") }
        : undefined,
  };
};

// "MAR" for the first race of each month on the phone's vertical strip
export const getMonthLabel = (race: Race, previous?: Race) => {
  const month = toDate(race.date).getUTCMonth();
  return previous && toDate(previous.date).getUTCMonth() === month
    ? undefined
    : MONTHS[month];
};

// Month grid

export type MonthCell = {
  // "2026-10-09"
  date: string;
  day: number;
  // Days from the months either side that fill the first and last weeks
  inMonth: boolean;
  isToday: boolean;
  // The round on track that day, with that day's sessions
  row?: RoundState;
  sessions: Session[];
  isRaceDay: boolean;
};

// The day a session falls on at the track, like the posters' dates.
// Without a start time only the UTC date is known.
const sessionDay = (session: Pick<Session, "start" | "hasTime">, race: Race) =>
  formatIsoDate(
    session.start,
    (session.hasTime && getCircuitTimezone(race.Circuit.circuitId)) || "UTC",
  );

// 10 for "2026-10-09"
const monthOf = (date: string) => Number(date.slice(5, 7));

// Each round's sessions by the day they fall on
const getRoundDays = (row: RoundState) => {
  const days = new Map<string, Session[]>();
  getSessions(row.race).forEach((session) => {
    const day = sessionDay(session, row.race);
    days.set(day, [...(days.get(day) ?? []), session]);
  });
  return days;
};

// The month a round belongs to: its race day's
export const getRoundMonth = (race: Race) =>
  monthOf(
    sessionDay({ start: getRaceStart(race), hasTime: !!race.time }, race),
  );

// The months the season runs through, 1 to 12, from the opener's first
// session to the finale's race
export const getSeasonMonths = (rows: RoundState[]) => {
  const first = monthOf(
    [...getRoundDays(rows[0]).keys()][0] ?? rows[0].race.date,
  );
  const last = getRoundMonth(rows[rows.length - 1].race);
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
};

// "October"
export const formatMonthName = (month: number) =>
  new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });

// A month's weeks, Monday first so a race weekend sits together at the end
// of its row, with each round's sessions on their days
export const getMonthLayout = (
  rows: RoundState[],
  year: number,
  month: number,
  now: number,
) => {
  const byDay = new Map<string, { row: RoundState; sessions: Session[] }>();
  rows.forEach((row) => {
    getRoundDays(row).forEach((sessions, day) => {
      byDay.set(day, { row, sessions });
    });
  });

  const first = Date.UTC(year, month - 1, 1);
  const last = Date.UTC(year, month, 0);
  // getUTCDay() is 0 on Sundays
  const start = first - ((new Date(first).getUTCDay() + 6) % 7) * DAY;
  const end = last + ((7 - new Date(last).getUTCDay()) % 7) * DAY;
  const today = formatIsoDate(now, "UTC");

  const weeks: MonthCell[][] = [];
  for (let time = start; time <= end; time += DAY) {
    const date = formatIsoDate(time, "UTC");
    const entry = byDay.get(date);
    if (!(((time - start) / DAY) % 7)) weeks.push([]);
    weeks[weeks.length - 1].push({
      date,
      day: new Date(time).getUTCDate(),
      inMonth: monthOf(date) === month,
      isToday: date === today,
      row: entry?.row,
      sessions: entry?.sessions ?? [],
      isRaceDay: !!entry?.sessions.some((session) => session.key === "race"),
    });
  }
  return weeks;
};

// The month the grid shows and the round picked under it. The URL can name
// both; otherwise it's the next round (the finale once the season is over)
// and its month. A round outside the month gives way to the next one if
// that's in it, then to the month's first.
export const getMonthSelection = (
  rows: RoundState[],
  query: Pick<CalendarQuery, "month" | "round">,
) => {
  const months = getSeasonMonths(rows);
  const picked = rows.find((row) => row.race.round === query.round);
  const next = rows.find((row) => row.isNext);
  const month =
    query.month && months.includes(query.month)
      ? query.month
      : getRoundMonth((picked ?? next ?? rows[rows.length - 1]).race);
  const inMonth = rows.filter((row) =>
    [...getRoundDays(row).keys()].some((day) => monthOf(day) === month),
  );
  const selected =
    [picked, next].find((row) => row && inMonth.includes(row)) ?? inMonth[0];
  return { months, month, selected, rounds: inMonth.length };
};

// URLs

export type CalendarView = "posters" | "timeline" | "month";
export type PosterFilter = "around" | "done" | "todo";
export type TimelineFilter = "all" | "sprints" | "night";

export type CalendarQuery = {
  view: CalendarView;
  show: PosterFilter;
  only: TimelineFilter;
  // The timeline's or the month grid's selected round. The next one when
  // left out.
  round?: string;
  // The month grid's month, 1 to 12. The selected round's when left out.
  month?: number;
};

// Reads the page's search params, ignoring anything it doesn't know
export const parseCalendarQuery = (
  params: Record<string, string | string[] | undefined>,
): CalendarQuery => {
  const value = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const show = value("show");
  const only = value("only");
  const round = value("round");
  const view = value("view");
  const month = Number(value("month"));
  return {
    view: view === "timeline" || view === "month" ? view : "posters",
    show: show === "done" || show === "todo" ? show : "around",
    only: only === "sprints" || only === "night" ? only : "all",
    round: round && /^\d{1,2}$/.test(round) ? round : undefined,
    month:
      Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
  };
};

// "/calendar", "/calendar?show=done", "/calendar?view=timeline&only=night",
// "/calendar?view=month&month=10".
// Defaults stay out of the URL, and each view only keeps its own params.
export const calendarHref = (query: Partial<CalendarQuery>) => {
  const params = new URLSearchParams();
  if (query.view === "timeline") {
    params.set("view", "timeline");
    if (query.only && query.only !== "all") params.set("only", query.only);
    if (query.round) params.set("round", query.round);
  } else if (query.view === "month") {
    params.set("view", "month");
    if (query.month) params.set("month", String(query.month));
    if (query.round) params.set("round", query.round);
  } else if (query.show && query.show !== "around") {
    params.set("show", query.show);
  }
  const search = params.toString();
  return search ? `/calendar?${search}` : "/calendar";
};
