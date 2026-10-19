import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CHAMPIONS, type Champion } from "@/lib/data/champions";
import {
  CONSTRUCTOR_CHAMPIONS,
  type ConstructorChampion,
} from "@/lib/data/constructorChampions";
import { isClassified } from "@/lib/domain/results";
import { findNextRace } from "@/lib/domain/sessions";
import { getDriverName } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import { CACHE_LIFE, type CacheTier } from "./cacheTiers";
import { fetchJson } from "./fetcher";
import type {
  Circuit,
  Constructor,
  ConstructorStanding,
  Driver,
  DriverStanding,
  PitStop,
  QualifyingResults,
  Race,
  RaceBase,
  RaceLaps,
  RacePitStops,
  RaceResults,
  RaceSprintResults,
  Season,
  Standings,
} from "./types";

// Jolpica F1, the Ergast-compatible API. One cached function per app hook.

const F1_API = "https://api.jolpi.ca/ergast/f1/";

// Jolpica returns at most 100 rows per request, whatever `limit` asks for
export const PAGE_SIZE = 100;

type Paged = { MRData: { total: string } };
type RaceTable<R> = Paged & {
  MRData: { RaceTable: { season?: string; Races: R[] } };
};
type StandingsTable<K extends string, T> = {
  MRData: {
    StandingsTable: {
      StandingsLists: ({ season: string; round: string } & Record<K, T[]>)[];
    };
  };
};

const jolpica = <T>(
  path: string,
  tier: CacheTier,
  { offset = 0, limit = PAGE_SIZE } = {},
) =>
  fetchJson<T>(`${F1_API}${path}?limit=${limit}&offset=${offset}`, {
    tier,
    tags: ["jolpica"],
  });

// Fetches every page of a list endpoint ("drivers/norris/results.json")
export const getAllPages = async <T extends Paged>(
  path: string,
  tier: CacheTier,
) => {
  const first = await jolpica<T>(path, tier);
  const total = Number(first.MRData.total);
  const offsets: number[] = [];
  for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) {
    offsets.push(offset);
  }
  const rest = await Promise.all(
    offsets.map((offset) => jolpica<T>(path, tier, { offset })),
  );
  return [first, ...rest];
};

// Pages count rows, not races, so a page can end in the middle of a race.
// Joins the rows that belong to the same round back together.
export const mergeRaces = <R extends RaceBase, K extends keyof R>(
  races: R[],
  field: K,
): R[] => {
  const byRound = new Map<string, R>();
  races.forEach((race) => {
    const key = `${race.season}-${race.round}`;
    const rows = (race[field] as unknown[] | undefined) ?? [];
    const current = byRound.get(key);
    if (current) {
      (current[field] as unknown[]).push(...rows);
    } else {
      byRound.set(key, { ...race, [field]: [...rows] });
    }
  });
  return [...byRound.values()];
};

const allRaces = async <R extends RaceBase>(path: string, tier: CacheTier) =>
  (await getAllPages<RaceTable<R>>(path, tier)).flatMap(
    (page) => page.MRData.RaceTable.Races,
  );

// Called first thing in every `use cache` scope below
const cacheFor = (tier: CacheTier) => {
  cacheLife(CACHE_LIFE[tier]);
  cacheTag("jolpica");
};

// Seasons

// The year Jolpica calls "current"
export async function getCurrentSeason(): Promise<number> {
  "use cache";
  cacheFor("current");
  const data = await jolpica<RaceTable<Race>>("current.json", "current", {
    limit: 1,
  });
  return Number(data.MRData.RaceTable.season);
}

export type SeasonParam = number | string; // 2024, "2024" or "current"
type SeasonTier = Extract<CacheTier, "current" | "past">;

// "current" becomes the year first, so it shares cache entries with the year
// and a finished season gets the long tier
const resolveSeason = async (season: SeasonParam) => {
  const current = await getCurrentSeason();
  const year = season === "current" ? current : Number(season);
  if (!Number.isInteger(year)) throw new Error(`Invalid season "${season}"`);
  const tier: SeasonTier = year < current ? "past" : "current";
  return { year, tier };
};

// Turns a cached loader keyed by (year, tier, …) into the public function
// that takes a season
const bySeason =
  <A extends unknown[], R>(
    load: (year: number, tier: SeasonTier, ...args: A) => Promise<R>,
  ) =>
  async (season: SeasonParam, ...args: A) => {
    const { year, tier } = await resolveSeason(season);
    return load(year, tier, ...args);
  };

export async function getSeasons(): Promise<Season[]> {
  "use cache";
  cacheFor("lists");
  const pages = await getAllPages<
    Paged & { MRData: { SeasonTable: { Seasons: Season[] } } }
  >("seasons.json", "lists");
  return pages.flatMap((page) => page.MRData.SeasonTable.Seasons);
}

async function loadSeasonSchedule(
  year: number,
  tier: SeasonTier,
): Promise<Race[]> {
  "use cache";
  cacheFor(tier);
  const data = await jolpica<RaceTable<Race>>(`${year}.json`, tier);
  return data.MRData.RaceTable.Races;
}
export const getSeasonSchedule = bySeason(loadSeasonSchedule);

async function loadDriverStandings(
  year: number,
  tier: SeasonTier,
): Promise<Standings<DriverStanding> | null> {
  "use cache";
  cacheFor(tier);
  const data = await jolpica<StandingsTable<"DriverStandings", DriverStanding>>(
    `${year}/driverStandings.json`,
    tier,
  );
  const list = data.MRData.StandingsTable.StandingsLists[0];
  if (!list) return null;
  return {
    season: list.season,
    round: list.round,
    standings: list.DriverStandings,
  };
}
export const getDriverStandings = bySeason(loadDriverStandings);

async function loadConstructorStandings(
  year: number,
  tier: SeasonTier,
): Promise<Standings<ConstructorStanding> | null> {
  "use cache";
  cacheFor(tier);
  const data = await jolpica<
    StandingsTable<"ConstructorStandings", ConstructorStanding>
  >(`${year}/constructorStandings.json`, tier);
  const list = data.MRData.StandingsTable.StandingsLists[0];
  if (!list) return null;
  return {
    season: list.season,
    round: list.round,
    standings: list.ConstructorStandings,
  };
}
export const getConstructorStandings = bySeason(loadConstructorStandings);

// The winner of every race in a season
async function loadSeasonWinners(
  year: number,
  tier: SeasonTier,
): Promise<RaceResults[]> {
  "use cache";
  cacheFor(tier);
  return allRaces<RaceResults>(`${year}/results/1.json`, tier);
}
export const getSeasonWinners = bySeason(loadSeasonWinners);

// Every race result of a season (~5 pages)
async function loadSeasonResults(
  year: number,
  tier: SeasonTier,
): Promise<RaceResults[]> {
  "use cache";
  cacheFor(tier);
  const races = await allRaces<RaceResults>(`${year}/results.json`, tier);
  return mergeRaces(races, "Results");
}
export const getSeasonResults = bySeason(loadSeasonResults);

// Every qualifying result of a season (~5 pages)
async function loadSeasonQualifying(
  year: number,
  tier: SeasonTier,
): Promise<QualifyingResults[]> {
  "use cache";
  cacheFor(tier);
  const races = await allRaces<QualifyingResults>(
    `${year}/qualifying.json`,
    tier,
  );
  return mergeRaces(races, "QualifyingResults");
}
export const getSeasonQualifying = bySeason(loadSeasonQualifying);

// Every sprint result of a season (empty before 2021)
async function loadSeasonSprintResults(
  year: number,
  tier: SeasonTier,
): Promise<RaceSprintResults[]> {
  "use cache";
  cacheFor(tier);
  const races = await allRaces<RaceSprintResults>(`${year}/sprint.json`, tier);
  return mergeRaces(races, "SprintResults");
}
export const getSeasonSprintResults = bySeason(loadSeasonSprintResults);

// The pole sitter of every race in a season
async function loadSeasonPoles(
  year: number,
  tier: SeasonTier,
): Promise<QualifyingResults[]> {
  "use cache";
  cacheFor(tier);
  return allRaces<QualifyingResults>(`${year}/qualifying/1.json`, tier);
}
export const getSeasonPoles = bySeason(loadSeasonPoles);

// The winner of every sprint in a season (empty before 2021)
async function loadSeasonSprintWinners(
  year: number,
  tier: SeasonTier,
): Promise<RaceSprintResults[]> {
  "use cache";
  cacheFor(tier);
  return allRaces<RaceSprintResults>(`${year}/sprint/1.json`, tier);
}
export const getSeasonSprintWinners = bySeason(loadSeasonSprintWinners);

// Which rounds have race, qualifying and sprint results, from each one's P1
// rows: a request each per season, shared by every race weekend page
async function loadRoundsWithResults(
  year: number,
  tier: SeasonTier,
): Promise<{ race: string[]; qualifying: string[]; sprint: string[] }> {
  "use cache";
  cacheFor(tier);
  const rounds = (races: RaceBase[]) => [...new Set(races.map((r) => r.round))];
  const [race, qualifying, sprint] = await Promise.all([
    loadSeasonWinners(year, tier),
    loadSeasonPoles(year, tier),
    loadSeasonSprintWinners(year, tier),
  ]);
  return {
    race: rounds(race),
    qualifying: rounds(qualifying),
    sprint: rounds(sprint),
  };
}
export const getRoundsWithResults = bySeason(loadRoundsWithResults);

// One race weekend

type Round = string | number;

async function loadRaceResults(
  year: number,
  tier: SeasonTier,
  round: Round,
): Promise<RaceResults | null> {
  "use cache";
  cacheFor(tier);
  const data = await jolpica<RaceTable<RaceResults>>(
    `${year}/${round}/results.json`,
    tier,
  );
  return data.MRData.RaceTable.Races[0] ?? null;
}
export const getRaceResults = bySeason(loadRaceResults);

async function loadQualifying(
  year: number,
  tier: SeasonTier,
  round: Round,
): Promise<QualifyingResults | null> {
  "use cache";
  cacheFor(tier);
  const data = await jolpica<RaceTable<QualifyingResults>>(
    `${year}/${round}/qualifying.json`,
    tier,
  );
  return data.MRData.RaceTable.Races[0] ?? null;
}
export const getQualifying = bySeason(loadQualifying);

async function loadSprint(
  year: number,
  tier: SeasonTier,
  round: Round,
): Promise<RaceSprintResults | null> {
  "use cache";
  cacheFor(tier);
  const data = await jolpica<RaceTable<RaceSprintResults>>(
    `${year}/${round}/sprint.json`,
    tier,
  );
  return data.MRData.RaceTable.Races[0] ?? null;
}
export const getSprint = bySeason(loadSprint);

// The latest race with results. "current/last" moves, so it stays short.
export async function getLastRaceResults(): Promise<RaceResults | null> {
  "use cache";
  cacheFor("current");
  const data = await jolpica<RaceTable<RaceResults>>(
    "current/last/results.json",
    "current",
  );
  return data.MRData.RaceTable.Races[0] ?? null;
}

// Lap-by-lap data starts in 1996 and pit stops in 2011
export const LAPS_FIRST_SEASON = 1996;
export const PIT_STOPS_FIRST_SEASON = 2011;

// Position of every driver at the end of every lap: driverId -> [lap 1, lap 2…]
export type LapPositions = Record<string, number[]>;

// One row per driver per lap, so a race is ~12 pages
async function loadLapPositions(
  year: number,
  tier: SeasonTier,
  round: Round,
): Promise<{ positions: LapPositions; laps: number }> {
  "use cache";
  cacheFor(tier);
  const races = await allRaces<RaceLaps>(`${year}/${round}/laps.json`, tier);
  const positions: LapPositions = {};
  let laps = 0;
  races.forEach((race) =>
    race.Laps?.forEach((lap) => {
      const index = Number(lap.number) - 1;
      laps = Math.max(laps, index + 1);
      lap.Timings.forEach((timing) => {
        positions[timing.driverId] ??= [];
        positions[timing.driverId][index] = Number(timing.position);
      });
    }),
  );
  return { positions, laps };
}
export const getLapPositions = bySeason(loadLapPositions);

// Pit lane times, available from PIT_STOPS_FIRST_SEASON
async function loadPitStops(
  year: number,
  tier: SeasonTier,
  round: Round,
): Promise<PitStop[]> {
  "use cache";
  cacheFor(tier);
  const races = await allRaces<RacePitStops>(
    `${year}/${round}/pitstops.json`,
    tier,
  );
  return mergeRaces(races, "PitStops")[0]?.PitStops ?? [];
}
export const getPitStops = bySeason(loadPitStops);

// Finishing position per round, oldest first. 0 = did not finish, null = no entry.
export type Form = (number | null)[];

// Per-driver and per-team form over the last few rounds, built from the
// per-race cache
export const getRecentForm = async (
  season: SeasonParam,
  lastRound: number,
  count = 5,
) => {
  const size = Math.min(count, lastRound);
  const rounds = Array.from(
    { length: size },
    (_, i) => lastRound - size + 1 + i,
  );
  const races = await Promise.all(
    rounds.map((round) => getRaceResults(season, round)),
  );

  const drivers: Record<string, Form> = {};
  const teams: Record<string, Form> = {};
  races.forEach((race, index) => {
    race?.Results?.forEach((result) => {
      const position = isClassified(result) ? Number(result.position) : 0;
      const driverId = result.Driver.driverId;
      const teamId = result.Constructor.constructorId;

      drivers[driverId] ??= Array(size).fill(null);
      drivers[driverId][index] = position;

      // A team's form is its best finisher in each round
      teams[teamId] ??= Array(size).fill(null);
      const best = teams[teamId][index];
      if (best === null || (position > 0 && (best === 0 || position < best))) {
        teams[teamId][index] = position;
      }
    });
  });
  return { drivers, teams };
};

// Drivers

export async function getDriver(driverId: string): Promise<Driver | null> {
  "use cache";
  cacheFor("lists");
  const data = await jolpica<{
    MRData: { DriverTable: { Drivers: Driver[] } };
  }>(`drivers/${driverId}.json`, "lists");
  return data.MRData.DriverTable.Drivers[0] ?? null;
}

export type CareerRace = {
  season: string;
  round: string;
  raceName: string;
  position: number; // best finish, 0 = not classified
  grid: number; // 0 = pit lane start
  points: number; // race only
  sprintPoints: number;
  sprintPosition?: number;
  Constructor: Constructor;
};

export type CareerSeason = {
  season: string;
  points: number; // race + sprint, before any dropped scores
  wins: number;
  podiums: number;
  team: Constructor; // the last one that season
};

export type Career = {
  races: CareerRace[]; // starts, oldest first
  starts: number;
  wins: number;
  podiums: number;
  poles: number;
  seasons: CareerSeason[]; // oldest first
  // On the current grid (or last season's, before the first race)
  onGrid: boolean;
};

// Withdrawn and failed to qualify: in the results, but not a start
const NOT_STARTED = new Set(["W", "F"]);

const isPodium = (position: number) => position >= 1 && position <= 3;

type CareerTier = Extract<CacheTier, "lists" | "past">;

// Starts and pole positions, before the totals are added up
type CareerEntries = {
  races: CareerRace[];
  poles: string[]; // "2026-16"
};

const raceKey = (race: Pick<RaceBase, "season" | "round">) =>
  `${race.season}-${race.round}`;

// Turns a driver's result rows into starts. In the 1950s drivers could share
// cars, so one race can hold several of their results: the best finish
// counts, and the points add up.
const toCareerEntries = (
  results: RaceResults[],
  sprints: RaceSprintResults[],
): CareerEntries => {
  const sprintByRound = new Map(
    sprints.map((race) => [raceKey(race), race.SprintResults?.[0]]),
  );

  const entries = mergeRaces(results, "Results");
  const races: CareerRace[] = entries.flatMap((race) => {
    const rows = (race.Results ?? []).filter(
      (row) => !NOT_STARTED.has(row.positionText),
    );
    if (!rows.length) return [];
    const finish = (row: (typeof rows)[number]) =>
      isClassified(row) ? Number(row.position) : Infinity;
    const best = rows.reduce((a, b) => (finish(b) < finish(a) ? b : a));
    const sprint = sprintByRound.get(raceKey(race));
    return [
      {
        season: race.season,
        round: race.round,
        raceName: race.raceName,
        position: isClassified(best) ? Number(best.position) : 0,
        grid: Number(best.grid),
        points: rows.reduce((sum, row) => sum + Number(row.points), 0),
        sprintPoints: Number(sprint?.points ?? 0),
        sprintPosition:
          sprint && isClassified(sprint) ? Number(sprint.position) : undefined,
        Constructor: best.Constructor,
      },
    ];
  });

  // Pole position is the front of the grid, which is how the record books
  // count it: penalties and sprints can move it away from the fastest
  // qualifier. It also works before qualifying results start in the 1990s.
  const poles = entries
    .filter((race) => race.Results?.some((row) => row.grid === "1"))
    .map(raceKey);

  return { races, poles };
};

// Career totals and the numbers for each season
const summarizeCareer = (
  { races, poles }: CareerEntries,
  onGrid: boolean,
): Career => {
  const seasons = new Map<string, CareerSeason>();
  races.forEach((race) => {
    const season = seasons.get(race.season) ?? {
      season: race.season,
      points: 0,
      wins: 0,
      podiums: 0,
      team: race.Constructor,
    };
    season.points += race.points + race.sprintPoints;
    season.wins += race.position === 1 ? 1 : 0;
    season.podiums += isPodium(race.position) ? 1 : 0;
    season.team = race.Constructor;
    seasons.set(race.season, season);
  });

  return {
    races,
    starts: races.length,
    wins: races.filter((r) => r.position === 1).length,
    podiums: races.filter((r) => isPodium(r.position)).length,
    poles: poles.length,
    seasons: [...seasons.values()],
    onGrid,
  };
};

// A driver's whole career: race and sprint results (2–6 pages)
async function loadDriverCareer(
  driverId: string,
  tier: CareerTier,
): Promise<CareerEntries> {
  "use cache";
  cacheFor(tier);
  const [results, sprints] = await Promise.all([
    allRaces<RaceResults>(`drivers/${driverId}/results.json`, tier),
    allRaces<RaceSprintResults>(`drivers/${driverId}/sprint.json`, tier),
  ]);
  return toCareerEntries(results, sprints);
}

// One season of a career (a page each for races and sprints)
async function loadDriverSeasonCareer(
  year: number,
  tier: SeasonTier,
  driverId: string,
): Promise<CareerEntries> {
  "use cache";
  cacheFor(tier);
  const [results, sprints] = await Promise.all([
    allRaces<RaceResults>(`${year}/drivers/${driverId}/results.json`, tier),
    allRaces<RaceSprintResults>(
      `${year}/drivers/${driverId}/sprint.json`,
      tier,
    ),
  ]);
  return toCareerEntries(results, sprints);
}
const getDriverSeasonCareer = bySeason(loadDriverSeasonCareer);

// Current drivers' careers grow every race weekend; retired ones never change.
// Before the first race the new season has no standings, so last season's
// grid still counts as current.
const getCareerTier = async (driverId: string): Promise<CareerTier> => {
  const current = await getCurrentSeason();
  const standings =
    (await getDriverStandings(current)) ??
    (await getDriverStandings(current - 1));
  const racing = standings?.standings.some(
    (s) => s.Driver.driverId === driverId,
  );
  return racing ? "lists" : "past";
};

// The whole career is cached daily for current drivers and monthly for
// retired ones, to keep big careers off the hourly quota. The season in
// progress comes from two small requests on the current season's cache
// instead, so it's as fresh as the standings.
export const getDriverCareer = async (driverId: string) => {
  const tier = await getCareerTier(driverId);
  if (tier === "past")
    return summarizeCareer(await loadDriverCareer(driverId, tier), false);

  const current = String(await getCurrentSeason());
  const [history, season] = await Promise.all([
    loadDriverCareer(driverId, tier),
    getDriverSeasonCareer(current, driverId),
  ]);
  return summarizeCareer(
    {
      races: [
        ...history.races.filter((race) => race.season !== current),
        ...season.races,
      ],
      poles: [
        ...history.poles.filter((key) => !key.startsWith(`${current}-`)),
        ...season.poles,
      ],
    },
    true,
  );
};

// Championship position, points and wins in one season, or null when the
// driver has no standing that season
async function loadDriverSeasonStanding(
  year: number,
  tier: SeasonTier,
  driverId: string,
): Promise<DriverStanding | null> {
  "use cache";
  cacheFor(tier);
  const data = await jolpica<StandingsTable<"DriverStandings", DriverStanding>>(
    `${year}/drivers/${driverId}/driverStandings.json`,
    tier,
  );
  return (
    data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings[0] ?? null
  );
}
export const getDriverSeasonStanding = bySeason(loadDriverSeasonStanding);

// The driver's standing in each of the given seasons (one small request each)
export const getDriverSeasonStandings = (driverId: string, seasons: string[]) =>
  Promise.all(
    seasons.map(async (season) => ({
      season,
      standing: await getDriverSeasonStanding(season, driverId),
    })),
  );

// Constructors

export async function getConstructor(
  constructorId: string,
): Promise<Constructor | null> {
  "use cache";
  cacheFor("lists");
  const data = await jolpica<{
    MRData: { ConstructorTable: { Constructors: Constructor[] } };
  }>(`constructors/${constructorId}.json`, "lists");
  return data.MRData.ConstructorTable.Constructors[0] ?? null;
}

// Every season the team raced, oldest first
export async function getConstructorSeasons(
  constructorId: string,
): Promise<string[]> {
  "use cache";
  cacheFor("lists");
  const pages = await getAllPages<
    Paged & { MRData: { SeasonTable: { Seasons: Season[] } } }
  >(`constructors/${constructorId}/seasons.json`, "lists");
  return pages.flatMap((page) =>
    page.MRData.SeasonTable.Seasons.map((s) => s.season),
  );
}

// The rounds a team won, as "2026-16". A shared drive in the 1950s has a
// winning row for each driver, but it's one win.
const wonRounds = (races: RaceResults[]) => [...new Set(races.map(raceKey))];

async function loadConstructorWins(
  constructorId: string,
  tier: CareerTier,
): Promise<string[]> {
  "use cache";
  cacheFor(tier);
  return wonRounds(
    await allRaces<RaceResults>(
      `constructors/${constructorId}/results/1.json`,
      tier,
    ),
  );
}

async function loadConstructorSeasonWins(
  year: number,
  tier: SeasonTier,
  constructorId: string,
): Promise<string[]> {
  "use cache";
  cacheFor(tier);
  return wonRounds(
    await allRaces<RaceResults>(
      `${year}/constructors/${constructorId}/results/1.json`,
      tier,
    ),
  );
}
const getConstructorSeasonWins = bySeason(loadConstructorSeasonWins);

// All-time race wins. Like a driver's career, the history is cached daily for
// teams on the current grid and monthly for the rest, and the season in
// progress comes from one small request on the current season's cache.
export const getConstructorWins = async (
  constructorId: string,
  seasons: string[],
) => {
  const current = String(await getCurrentSeason());
  if (!seasons.includes(current))
    return (await loadConstructorWins(constructorId, "past")).length;

  const [history, season] = await Promise.all([
    loadConstructorWins(constructorId, "lists"),
    getConstructorSeasonWins(current, constructorId),
  ]);
  return (
    history.filter((key) => !key.startsWith(`${current}-`)).length +
    season.length
  );
};

async function loadConstructorSeasonPosition(
  year: number,
  tier: SeasonTier,
  constructorId: string,
): Promise<number> {
  "use cache";
  cacheFor(tier);
  const data = await jolpica<
    StandingsTable<"ConstructorStandings", ConstructorStanding>
  >(`${year}/constructors/${constructorId}/constructorStandings.json`, tier);
  const standing =
    data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings[0];
  return Number(standing?.position ?? 0);
}
const getConstructorSeasonPosition = bySeason(loadConstructorSeasonPosition);

// Constructors' championship position in each of the given seasons
export const getConstructorSeasonPositions = (
  constructorId: string,
  seasons: string[],
) =>
  Promise.all(
    seasons.map(async (season) => ({
      season,
      position: await getConstructorSeasonPosition(season, constructorId),
    })),
  );

// Champions

// The title files in lib/data are the fixed history. Seasons that finish
// after their last line come from the API: the running season costs only the
// standings and schedule most pages load anyway, and a finished one adds a
// request per title, cached for a month.

// A season is over once the standings are after the last round of the
// schedule and that race has ended. Cached with the season, so the clock
// read here is at most one revalidation old.
async function loadSeasonFinished(
  year: number,
  tier: SeasonTier,
): Promise<boolean> {
  "use cache";
  cacheFor(tier);
  const [standings, races] = await Promise.all([
    loadDriverStandings(year, tier),
    loadSeasonSchedule(year, tier),
  ]);
  return (
    !!standings &&
    races.length > 0 &&
    Number(standings.round) === races.length &&
    !findNextRace(races, Date.now())
  );
}
const isSeasonFinished = bySeason(loadSeasonFinished);

// The top two of the final standings: the champion and the runner-up
async function loadDriversChampion(year: number): Promise<Champion | null> {
  "use cache";
  cacheFor("past");
  const data = await jolpica<StandingsTable<"DriverStandings", DriverStanding>>(
    `${year}/driverStandings.json`,
    "past",
    { limit: 2 },
  );
  const list = data.MRData.StandingsTable.StandingsLists[0];
  const [leader, second] = list?.DriverStandings ?? [];
  const team = leader?.Constructors.at(-1);
  if (!leader || !second || !team) return null;
  return {
    season: list.season,
    rounds: Number(list.round),
    driverId: leader.Driver.driverId,
    driver: getDriverName(leader.Driver),
    teamId: team.constructorId,
    team: team.name,
    points: Number(leader.points),
    wins: Number(leader.wins),
    runnerUp: getDriverName(second.Driver),
    runnerUpPoints: Number(second.points),
  };
}

async function loadConstructorsChampion(
  year: number,
): Promise<ConstructorChampion | null> {
  "use cache";
  cacheFor("past");
  const data = await jolpica<
    StandingsTable<"ConstructorStandings", ConstructorStanding>
  >(`${year}/constructorStandings.json`, "past", { limit: 2 });
  const list = data.MRData.StandingsTable.StandingsLists[0];
  const [leader, second] = list?.ConstructorStandings ?? [];
  if (!leader || !second) return null;
  return {
    season: list.season,
    rounds: Number(list.round),
    teamId: leader.Constructor.constructorId,
    team: leader.Constructor.name,
    points: Number(leader.points),
    wins: Number(leader.wins),
    runnerUp: second.Constructor.name,
    runnerUpPoints: Number(second.points),
  };
}

// Seasons after `last` that have finished, oldest first. Usually none, or
// the one that just ended. Seasons before the current one are over without
// asking.
const getFinishedSeasonsAfter = async (last: string) => {
  const current = await getCurrentSeason();
  const years: number[] = [];
  for (let year = Number(last) + 1; year <= current; year++) {
    if (year < current || (await isSeasonFinished(year))) years.push(year);
  }
  return years;
};

// Every drivers' champion, oldest first
export const getChampions = async (): Promise<Champion[]> => {
  // If the API fails the file alone still shows
  const added = await orFallback(
    getFinishedSeasonsAfter(CHAMPIONS.at(-1)!.season).then((years) =>
      Promise.all(years.map(loadDriversChampion)),
    ),
  );
  return [...CHAMPIONS, ...(added ?? []).filter((c) => c !== null)];
};

// The drivers' champion of a season, or undefined while it's running.
// Seasons in the file cost no requests.
export const getChampion = async (season: string) =>
  CHAMPIONS.find((c) => c.season === season) ??
  (await getChampions()).find((c) => c.season === season);

// Seasons the driver won the title, oldest first
export const getTitleSeasons = async (driverId: string) =>
  (await getChampions())
    .filter((c) => c.driverId === driverId)
    .map((c) => c.season);

// Every constructors' champion, oldest first
export const getConstructorChampionList = async (): Promise<
  ConstructorChampion[]
> => {
  // If the API fails the file alone still shows
  const added = await orFallback(
    getFinishedSeasonsAfter(CONSTRUCTOR_CHAMPIONS.at(-1)!.season).then(
      (years) => Promise.all(years.map(loadConstructorsChampion)),
    ),
  );
  return [...CONSTRUCTOR_CHAMPIONS, ...(added ?? []).filter((c) => c !== null)];
};

// Constructors' champions by season: season → constructorId
export const getConstructorChampions = async (): Promise<
  Record<string, string>
> =>
  Object.fromEntries(
    (await getConstructorChampionList()).map((c) => [c.season, c.teamId]),
  );

// Seasons the team won the constructors' title, oldest first
export const getConstructorTitles = async (constructorId: string) =>
  Object.entries(await getConstructorChampions())
    .filter(([, id]) => id === constructorId)
    .map(([season]) => season);

// Circuits

export async function getCircuit(circuitId: string): Promise<Circuit | null> {
  "use cache";
  cacheFor("lists");
  const data = await jolpica<{
    MRData: { CircuitTable: { Circuits: Circuit[] } };
  }>(`circuits/${circuitId}.json`, "lists");
  return data.MRData.CircuitTable.Circuits[0] ?? null;
}

// Every race held at a circuit with its winner, plus each race's fastest lap
export async function getCircuitHistory(circuitId: string): Promise<{
  races: RaceResults[];
  fastestLaps: RaceResults[];
}> {
  "use cache";
  cacheFor("lists");
  const [races, fastestLaps] = await Promise.all([
    allRaces<RaceResults>(`circuits/${circuitId}/results/1.json`, "lists"),
    allRaces<RaceResults>(
      `circuits/${circuitId}/fastest/1/results.json`,
      "lists",
    ),
  ]);
  return { races, fastestLaps };
}

// Full lists (search index, sitemaps)

export async function getAllDrivers(): Promise<Driver[]> {
  "use cache";
  cacheFor("lists");
  const pages = await getAllPages<
    Paged & { MRData: { DriverTable: { Drivers: Driver[] } } }
  >("drivers.json", "lists");
  return pages.flatMap((page) => page.MRData.DriverTable.Drivers);
}

export async function getAllConstructors(): Promise<Constructor[]> {
  "use cache";
  cacheFor("lists");
  const pages = await getAllPages<
    Paged & { MRData: { ConstructorTable: { Constructors: Constructor[] } } }
  >("constructors.json", "lists");
  return pages.flatMap((page) => page.MRData.ConstructorTable.Constructors);
}

export async function getAllCircuits(): Promise<Circuit[]> {
  "use cache";
  cacheFor("lists");
  const pages = await getAllPages<
    Paged & { MRData: { CircuitTable: { Circuits: Circuit[] } } }
  >("circuits.json", "lists");
  return pages.flatMap((page) => page.MRData.CircuitTable.Circuits);
}

// Every race since 1950 (~12 pages), schedule fields only
export async function getAllRaces(): Promise<RaceBase[]> {
  "use cache";
  cacheFor("lists");
  return allRaces<RaceBase>("races.json", "lists");
}
