// Layout maths for the calendar's two views: the posters' summary and the
// timeline's date axis.
import type { Constructor, Race } from "@/lib/api/types";
import { getCircuitTimezone } from "./circuits";
import { getWeekendStart, getRaceStart, type RoundState } from "./sessions";
import { formatDateRange, formatShortDate, toDate } from "./time";

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

// URLs

export type CalendarView = "posters" | "timeline";
export type PosterFilter = "around" | "done" | "todo";
export type TimelineFilter = "all" | "sprints" | "night";

export type CalendarQuery = {
  view: CalendarView;
  show: PosterFilter;
  only: TimelineFilter;
  // The timeline's selected round. The next one when left out.
  round?: string;
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
  return {
    view: value("view") === "timeline" ? "timeline" : "posters",
    show: show === "done" || show === "todo" ? show : "around",
    only: only === "sprints" || only === "night" ? only : "all",
    round: round && /^\d{1,2}$/.test(round) ? round : undefined,
  };
};

// "/calendar", "/calendar?show=done", "/calendar?view=timeline&only=night".
// Defaults stay out of the URL, and each view only keeps its own params.
export const calendarHref = (query: Partial<CalendarQuery>) => {
  const params = new URLSearchParams();
  if (query.view === "timeline") {
    params.set("view", "timeline");
    if (query.only && query.only !== "all") params.set("only", query.only);
    if (query.round) params.set("round", query.round);
  } else if (query.show && query.show !== "around") {
    params.set("show", query.show);
  }
  const search = params.toString();
  return search ? `/calendar?${search}` : "/calendar";
};
