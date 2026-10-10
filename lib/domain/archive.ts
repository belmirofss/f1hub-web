// The archive's Champions Grid: every season since 1950, one row per decade,
// each cell in the colour of the champion's team. Pure, so the season pages'
// champion card can share the summary line.
import type { Champion } from "@/lib/data/champions";
import type { ConstructorChampion } from "@/lib/data/constructorChampions";
import { formatPoints, ordinal } from "./drivers";
import {
  driverHref,
  FIRST_CONSTRUCTORS_SEASON,
  FIRST_SEASON,
  seasonHref,
  teamHref,
} from "./routes";
import { getTeamHero } from "./teams";

export type ArchiveView = "drivers" | "constructors";

// One title of either championship
export type Title = {
  season: string;
  rounds: number;
  // Who titles are counted for: the driver, or the team's family, so the
  // seven Lotus titles count together whatever the engine
  id: string;
  name: string;
  teamId: string;
  team: string;
  href: string;
  points: number;
  wins: number;
  runnerUp: string;
  runnerUpPoints: number;
};

// "lotus-climax", "lotus-ford" and "team_lotus" → "lotus"
const teamFamily = (constructorId: string) => {
  const chassis = constructorId.split("-")[0];
  return chassis === "team_lotus" ? "lotus" : chassis;
};

// "Lotus-Climax" → "Lotus", "Team Lotus" → "Lotus"
const familyName = (team: string) =>
  team.replace(/-.*$/, "").replace(/^Team /, "");

export const fromDriversChampion = (c: Champion): Title => ({
  season: c.season,
  rounds: c.rounds,
  id: c.driverId,
  name: c.driver,
  teamId: c.teamId,
  team: c.team,
  href: driverHref(c.driverId),
  points: c.points,
  wins: c.wins,
  runnerUp: c.runnerUp,
  runnerUpPoints: c.runnerUpPoints,
});

export const fromConstructorsChampion = (c: ConstructorChampion): Title => ({
  season: c.season,
  rounds: c.rounds,
  id: teamFamily(c.teamId),
  name: c.team,
  teamId: c.teamId,
  team: c.team,
  href: teamHref(c.teamId),
  points: c.points,
  wins: c.wins,
  runnerUp: c.runnerUp,
  runnerUpPoints: c.runnerUpPoints,
});

const NUMBER_WORDS = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
];

const plural = (count: number, word: string) =>
  `${formatPoints(count)} ${count === 1 ? word : `${word}s`}`;

// "Third title. 8 wins from 16 races, 3 points clear of Alain Prost." The
// titles counted are the ones in `titles` up to this season, so the season
// pages can pass the shipped list and cost no requests.
export const summarizeTitle = (title: Title, titles: Title[]) => {
  const number =
    titles.filter((t) => t.id === title.id && t.season < title.season).length +
    1;
  const nth = NUMBER_WORDS[number - 1] ?? ordinal(number);
  const wins = title.wins ? plural(title.wins, "win") : "No wins";
  const margin = title.points - title.runnerUpPoints;
  const clear = margin
    ? `${plural(margin, "point")} clear of ${title.runnerUp}`
    : `level on points with ${title.runnerUp}`;
  return `${nth} title. ${wins} from ${title.rounds} races, ${clear}.`;
};

// The live season's leader, for its cell's panel
export type Leader = {
  name: string;
  points: number;
  gap: number;
  second?: string;
  round: string;
  rounds: number;
};

// "Leads by 14 points from Oscar Piastri after round 17 of 24."
export const summarizeLeader = (leader: Leader) => {
  const ahead = !leader.second
    ? `Leads on ${plural(leader.points, "point")}`
    : leader.gap
      ? `Leads by ${plural(leader.gap, "point")} from ${leader.second}`
      : `Level on points with ${leader.second}`;
  return `${ahead} after round ${leader.round} of ${leader.rounds}.`;
};

// The grid

export type GridCell = {
  season: string;
  // A champion, the season under way, one with no champion (the 1950s in
  // constructors), a later season already in the API, or a year to come
  kind: "title" | "live" | "none" | "upcoming" | "future";
  // The season page. Years to come have none.
  href?: string;
  // On the cell: the surname or team, "Live"
  short?: string;
  background?: string;
  text?: string;
  // The detail panel: "1988 · McLaren", "Ayrton Senna", the summary
  meta: string;
  headline: string;
  summary: string;
  // Accessible name: "1988, Ayrton Senna, McLaren"
  label: string;
  // The list view: champion or "In progress", the drivers' team, wins
  // and points
  name: string;
  team?: string;
  wins?: number;
  points?: number;
  // What the filter matches: year, name and team
  search: string;
};

export type GridDecade = { label: string; short: string; cells: GridCell[] };

// "Räikkönen" matches "raikkonen"
export const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Surnames on the cells, with initials where two champions share one:
// "G. Hill", "D. Hill", "K. Rosberg"
const getShortNames = (titles: Title[], view: ArchiveView) => {
  const short = new Map<string, string>();
  if (view === "constructors") {
    titles.forEach((t) => short.set(t.id, familyName(t.team)));
    return short;
  }
  const surname = (name: string) => name.split(" ").at(-1)!;
  const owners = new Map<string, Set<string>>();
  titles.forEach((t) => {
    const ids = owners.get(surname(t.name)) ?? new Set();
    owners.set(surname(t.name), ids.add(t.id));
  });
  titles.forEach((t) => {
    const last = surname(t.name);
    short.set(
      t.id,
      owners.get(last)!.size > 1 ? `${t.name[0]}. ${last}` : last,
    );
  });
  return short;
};

// Decade rows from the 1950s to the current season's decade. `seasons` are
// the years the API has; a year past them is an empty slot.
export const getChampionsGrid = ({
  view,
  titles,
  seasons,
  current,
  live,
}: {
  view: ArchiveView;
  titles: Title[];
  seasons: string[];
  current: number;
  // The summary of the season under way, when it has started
  live?: { headline: string; summary: string };
}): GridDecade[] => {
  const byYear = new Map(titles.map((t) => [Number(t.season), t]));
  const short = getShortNames(titles, view);
  const known = new Set(seasons.map(Number));
  const last = Math.max(current, ...known);

  const cell = (year: number): GridCell => {
    const season = String(year);
    const title = byYear.get(year);
    if (title) {
      const hero = getTeamHero(title.teamId);
      const team = view === "drivers" ? `, ${title.team}` : "";
      return {
        season,
        kind: "title",
        href: seasonHref(season),
        short: short.get(title.id),
        background: hero.background,
        text: hero.text,
        meta:
          view === "drivers"
            ? `${season} · ${title.team}`
            : `${season} · Constructors' title`,
        headline: title.name,
        summary: summarizeTitle(title, titles),
        label: `${season}, ${title.name}${team}`,
        name: title.name,
        team: view === "drivers" ? title.team : undefined,
        wins: title.wins,
        points: title.points,
        search: normalize(`${season} ${title.name} ${title.team}`),
      };
    }
    if (!known.has(year)) {
      return {
        season,
        kind: "future",
        meta: season,
        headline: season,
        summary: "",
        label: season,
        name: "",
        search: season,
      };
    }
    if (year === current) {
      return {
        season,
        kind: "live",
        href: seasonHref(season),
        short: "Live",
        meta: `${season} · In progress`,
        headline: live?.headline ?? `Season ${season}`,
        summary: live?.summary ?? "The season hasn't started yet.",
        label: `${season}, season in progress`,
        name: "In progress",
        search: normalize(`${season} ${live?.headline ?? ""}`),
      };
    }
    if (year > current) {
      return {
        season,
        kind: "upcoming",
        href: seasonHref(season),
        meta: `${season} · Upcoming`,
        headline: `Season ${season}`,
        summary: "The season hasn't started yet.",
        label: `${season}, upcoming season`,
        name: "Upcoming",
        search: season,
      };
    }
    const early = view === "constructors" && year < FIRST_CONSTRUCTORS_SEASON;
    return {
      season,
      kind: "none",
      href: seasonHref(season),
      meta: season,
      headline: `Season ${season}`,
      summary: early
        ? `The constructors' championship started in ${FIRST_CONSTRUCTORS_SEASON}.`
        : "No champion yet.",
      label: early
        ? `${season}, before the constructors' championship`
        : `${season}, no champion yet`,
      name: early ? "No title" : "No champion",
      search: season,
    };
  };

  const decades: GridDecade[] = [];
  for (let decade = FIRST_SEASON; decade <= last; decade += 10) {
    decades.push({
      label: `${decade}s`,
      short: `'${String(decade).slice(2)}`,
      cells: Array.from({ length: 10 }, (_, i) => cell(decade + i)),
    });
  }
  return decades;
};

// Side panel: "Most titles", a dot per title

export type TitleCount = {
  id: string;
  name: string;
  href: string;
  count: number;
};

// The leaders, most titles first; ties go to whoever got there first
export const getMostTitles = (
  titles: Title[],
  view: ArchiveView,
  limit = 6,
): TitleCount[] => {
  const short = getShortNames(titles, view);
  const counts = new Map<string, TitleCount & { reached: string }>();
  titles.forEach((t) => {
    const entry = counts.get(t.id) ?? {
      id: t.id,
      name: short.get(t.id)!,
      href: t.href,
      count: 0,
      reached: t.season,
    };
    // A team family links to its latest name
    entry.href = t.href;
    entry.count++;
    entry.reached = t.season;
    counts.set(t.id, entry);
  });
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.reached.localeCompare(b.reached))
    .slice(0, limit)
    .map(({ id, name, href, count }) => ({ id, name, href, count }));
};

// Side panel: the colour legend, the teams with the most titles first

export type LegendEntry = { name: string; color: string };

export const getTeamLegend = (titles: Title[]): LegendEntry[] => {
  const teams = new Map<string, LegendEntry & { count: number }>();
  titles.forEach((t) => {
    const key = teamFamily(t.teamId);
    const entry = teams.get(key) ?? {
      name: familyName(t.team),
      color: getTeamHero(t.teamId).background,
      count: 0,
    };
    entry.count++;
    teams.set(key, entry);
  });
  return [...teams.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ name, color }) => ({ name, color }));
};

// URLs

// Reads the page's search params, ignoring anything it doesn't know
export const parseArchiveView = (
  params: Record<string, string | string[] | undefined>,
): ArchiveView => {
  const raw = params.view;
  return (Array.isArray(raw) ? raw[0] : raw) === "constructors"
    ? "constructors"
    : "drivers";
};

// "/archive" or "/archive?view=constructors"
export const archiveHref = (view: ArchiveView) =>
  view === "constructors" ? "/archive?view=constructors" : "/archive";
