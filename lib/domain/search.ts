// Ported from the app's src/helpers/search.ts. Results link to URLs instead
// of screens, and the index is plain JSON so /api/search-index can send it.
import type { Circuit, Constructor, Driver, Race } from "@/lib/api/types";
import { CHAMPIONS } from "@/lib/data/champions";
import { CONSTRUCTOR_CHAMPIONS } from "@/lib/data/constructorChampions";
import {
  circuitHref,
  driverHref,
  raceHref,
  seasonHref,
  teamHref,
} from "./routes";
import { getDriverCode, getDriverName, getTeamColor } from "./teams";
import { formatShortDate, toDate } from "./time";

export type SearchType = "driver" | "team" | "race" | "circuit" | "season";

export type SearchItem = {
  key: string;
  type: SearchType;
  title: string;
  subtitle: string;
  meta?: string;
  // Driver code, team abbreviation or short year shown in the leading badge
  badge?: string;
  color?: string;
  href: string;
};

export type SearchIndex = {
  drivers: Driver[];
  constructors: Constructor[];
  circuits: Circuit[];
  seasons: string[];
  currentSeason?: string;
  // Current grid: driverId → team, from the current standings
  currentTeams: Record<string, Constructor>;
  currentRaces: Race[];
  // Schedule of the year typed in the query, once it's loaded
  yearRaces: Race[];
};

// Names fans use that the API doesn't know
const TEAM_ALIASES: Record<string, string[]> = {
  mclaren: ["woking"],
  ferrari: ["scuderia", "maranello", "prancing horse", "tifosi"],
  red_bull: ["rbr", "milton keynes"],
  mercedes: ["silver arrows", "brackley", "amg"],
  aston_martin: ["amr"],
  rb: ["racing bulls", "vcarb", "visa cash app"],
  alphatauri: ["toro rosso"],
  sauber: ["kick", "stake", "hinwil"],
  alpine: ["enstone"],
};

const CIRCUIT_ALIASES: Record<string, string[]> = {
  americas: ["cota", "austin"],
  villeneuve: ["montreal"],
  interlagos: ["sao paulo", "brazil"],
  rodriguez: ["mexico city"],
  catalunya: ["montmelo"],
  red_bull_ring: ["a1 ring", "osterreichring"],
  spa: ["eau rouge"],
  monza: ["temple of speed"],
  yas_marina: ["abu dhabi"],
  marina_bay: ["night race"],
  vegas: ["strip"],
  imola: ["san marino"],
  madring: ["ifema"],
};

export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const words = (text: string) =>
  normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

// Every query word must start a word of one of the keys; keys are in order of
// importance. Lower is a better match, null is no match.
export const scoreMatch = (query: string[], keys: string[]) => {
  if (!query.length) return null;
  const keyWords = keys.map(words);
  let total = 0;
  for (const word of query) {
    let best: number | null = null;
    keyWords.forEach((list, index) => {
      const value = list.includes(word)
        ? index * 2
        : list.some((w) => w.startsWith(word))
          ? index * 2 + 1
          : null;
      if (value !== null && (best === null || value < best)) best = value;
    });
    if (best === null) return null;
    total += best;
  }
  return total;
};

export type ParsedQuery = {
  words: string[];
  year?: string;
  yearPrefix?: string;
};

// "monaco 2024" → words ["monaco"] and year "2024"
export const parseQuery = (raw: string, seasons: string[]): ParsedQuery => {
  const text = normalize(raw).trim();
  const year = text.match(/\b(19[5-9]\d|20\d\d)\b/)?.[1];
  const rest = (year ? text.replace(year, " ") : text).trim();
  if (!year && /^(19|20)\d$/.test(rest)) return { words: [], yearPrefix: rest };
  return {
    words: words(rest),
    year: year && seasons.includes(year) ? year : undefined,
  };
};

type Ranked = SearchItem & { rank: number };

const driverTitles = new Map<string, number>();
CHAMPIONS.forEach((c) =>
  driverTitles.set(c.driverId, (driverTitles.get(c.driverId) ?? 0) + 1),
);
const teamTitles = new Map<string, number>();
Object.values(CONSTRUCTOR_CHAMPIONS).forEach((id) =>
  teamTitles.set(id, (teamTitles.get(id) ?? 0) + 1),
);

const titlesText = (count?: number) =>
  count ? `${count}× champion` : undefined;

const raceItem = (race: Race, races: Race[], rank: number): Ranked => ({
  key: `race-${race.season}-${race.round}`,
  type: "race",
  rank,
  title: `${race.season} ${race.raceName}`,
  subtitle: `${race.Circuit.circuitName} · ${race.Circuit.Location.locality}`,
  meta: `R${race.round} · ${formatShortDate(toDate(race.date), "UTC")}`,
  href: raceHref(race, races),
});

export const seasonItem = (
  season: string,
  currentSeason?: string,
  rank = 0,
): Ranked => {
  const champion = CHAMPIONS.find((c) => c.season === season);
  return {
    key: `season-${season}`,
    type: "season",
    rank,
    title: `${season} season`,
    subtitle: champion
      ? `Champion ${champion.driver} · ${champion.team}`
      : season === currentSeason
        ? "In progress"
        : "World Championship",
    meta: champion ? `${champion.rounds} RACES` : undefined,
    badge: `'${season.slice(2)}`,
    href: seasonHref(season),
  };
};

const raceKeys = (race: Race) => [
  race.raceName,
  race.Circuit.circuitName,
  race.Circuit.Location.locality,
  race.Circuit.Location.country,
  ...(CIRCUIT_ALIASES[race.Circuit.circuitId] ?? []),
  race.Circuit.circuitId,
];

export const search = (raw: string, index: SearchIndex): SearchItem[] => {
  const query = parseQuery(raw, index.seasons);
  const results: Ranked[] = [];
  const currentTeamIds = new Set(
    Object.values(index.currentTeams).map((c) => c.constructorId),
  );

  index.drivers.forEach((driver) => {
    const team = index.currentTeams[driver.driverId];
    let rank = scoreMatch(query.words, [
      getDriverName(driver),
      driver.code ?? "",
      team?.name ?? "",
    ]);
    if (rank === null) return;
    if (
      query.words.length === 1 &&
      normalize(driver.code ?? "") === query.words[0]
    )
      rank -= 2;
    const titles = driverTitles.get(driver.driverId);
    results.push({
      key: `driver-${driver.driverId}`,
      type: "driver",
      rank: rank + (team ? 0 : titles ? 3 : 4),
      title: getDriverName(driver),
      subtitle: [team?.name, titlesText(titles), driver.nationality]
        .filter(Boolean)
        .join(" · "),
      meta:
        driver.permanentNumber && team
          ? `#${driver.permanentNumber}`
          : undefined,
      badge: getDriverCode(driver),
      color: team ? getTeamColor(team.constructorId) : undefined,
      href: driverHref(driver.driverId),
    });
  });

  index.constructors.forEach((team) => {
    const rank = scoreMatch(query.words, [
      team.name,
      ...(TEAM_ALIASES[team.constructorId] ?? []),
      team.constructorId,
    ]);
    if (rank === null) return;
    const current = currentTeamIds.has(team.constructorId);
    const lineup = index.drivers
      .filter(
        (d) =>
          index.currentTeams[d.driverId]?.constructorId === team.constructorId,
      )
      .map((d) => d.familyName);
    results.push({
      key: `team-${team.constructorId}`,
      type: "team",
      rank: rank + (current ? 1 : 5),
      title: team.name,
      subtitle:
        current && lineup.length
          ? lineup.join(" · ")
          : [titlesText(teamTitles.get(team.constructorId)), team.nationality]
              .filter(Boolean)
              .join(" · "),
      badge: team.name
        .replace(/[^A-Za-z]/g, "")
        .slice(0, 3)
        .toUpperCase(),
      color: getTeamColor(team.constructorId),
      href: teamHref(team.constructorId),
    });
  });

  const onCalendar = new Set(
    index.currentRaces.map((r) => r.Circuit.circuitId),
  );
  index.circuits.forEach((circuit) => {
    const rank = scoreMatch(query.words, [
      circuit.circuitName,
      circuit.Location.locality,
      ...(CIRCUIT_ALIASES[circuit.circuitId] ?? []),
      circuit.circuitId,
      circuit.Location.country,
    ]);
    if (rank === null) return;
    results.push({
      key: `circuit-${circuit.circuitId}`,
      type: "circuit",
      // With a year the race is what's wanted, so the circuit drops below it
      rank:
        rank +
        (onCalendar.has(circuit.circuitId) ? 1 : 3) +
        (query.year ? 4 : 0),
      title: circuit.circuitName,
      subtitle: `${circuit.Location.locality}, ${circuit.Location.country}`,
      meta: onCalendar.has(circuit.circuitId) ? index.currentSeason : undefined,
      href: circuitHref(circuit.circuitId),
    });
  });

  const races = query.year ? index.yearRaces : index.currentRaces;
  races.forEach((race) => {
    if (!query.words.length) {
      // A year on its own lists that season's races under the season itself
      if (query.year)
        results.push(raceItem(race, races, 10 + Number(race.round) / 100));
      return;
    }
    const rank = scoreMatch(query.words, raceKeys(race));
    if (rank !== null)
      results.push(raceItem(race, races, rank + (query.year ? -3 : 3)));
  });

  if (query.year)
    results.push(
      seasonItem(query.year, index.currentSeason, query.words.length ? 6 : -5),
    );
  if (query.yearPrefix) {
    index.seasons
      .filter((s) => s.startsWith(query.yearPrefix!))
      .reverse()
      .forEach((s, i) =>
        results.push(seasonItem(s, index.currentSeason, i / 100)),
      );
  }

  return (
    results
      .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ rank, ...item }) => item)
  );
};
