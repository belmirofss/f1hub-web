import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isClassified } from "@/lib/domain/results";
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

// Which rounds have race, qualifying and sprint results, from each one's P1
// rows: a request each per season, shared by every race weekend page
async function loadRoundsWithResults(
  year: number,
  tier: SeasonTier,
): Promise<{ race: string[]; qualifying: string[]; sprint: string[] }> {
  "use cache";
  cacheFor(tier);
  const rounds = async (path: string) => [
    ...new Set((await allRaces<RaceBase>(path, tier)).map((r) => r.round)),
  ];
  const [race, qualifying, sprint] = await Promise.all([
    rounds(`${year}/results/1.json`),
    rounds(`${year}/qualifying/1.json`),
    rounds(`${year}/sprint/1.json`),
  ]);
  return { race, qualifying, sprint };
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
  position: number; // 0 = not classified
  positionText: string;
  grid: number;
  points: number;
  sprintPoints: number;
  sprintPosition?: number;
  Constructor: Constructor;
};

export type CareerSeason = {
  season: string;
  points: number;
  wins: number;
  team: Constructor;
};

export type Career = {
  races: CareerRace[]; // oldest first
  starts: number;
  wins: number;
  podiums: number;
  poles: number;
  seasons: CareerSeason[]; // oldest first
};

// A driver's whole career: race, sprint and qualifying results (3–10 pages).
// Daily, not per race, to keep big careers off the hourly quota.
export async function getDriverCareer(driverId: string): Promise<Career> {
  "use cache";
  cacheFor("lists");
  const [results, sprints, qualifying] = await Promise.all([
    allRaces<RaceResults>(`drivers/${driverId}/results.json`, "lists"),
    allRaces<RaceSprintResults>(`drivers/${driverId}/sprint.json`, "lists"),
    allRaces<QualifyingResults>(`drivers/${driverId}/qualifying.json`, "lists"),
  ]);

  const sprintByRound = new Map(
    sprints.map((race) => [
      `${race.season}-${race.round}`,
      race.SprintResults?.[0],
    ]),
  );

  const races: CareerRace[] = results.flatMap((race) => {
    const result = race.Results?.[0];
    if (!result) return [];
    const sprint = sprintByRound.get(`${race.season}-${race.round}`);
    return [
      {
        season: race.season,
        round: race.round,
        raceName: race.raceName,
        position: isClassified(result) ? Number(result.position) : 0,
        positionText: result.positionText,
        grid: Number(result.grid),
        points: Number(result.points),
        sprintPoints: Number(sprint?.points ?? 0),
        sprintPosition:
          sprint && isClassified(sprint) ? Number(sprint.position) : undefined,
        Constructor: result.Constructor,
      },
    ];
  });

  // The API's "qualifying/1" filter is unreliable, so count pole positions here
  const poles = qualifying.filter(
    (race) => race.QualifyingResults?.[0]?.position === "1",
  ).length;

  const seasons = new Map<string, CareerSeason>();
  races.forEach((race) => {
    const season = seasons.get(race.season) ?? {
      season: race.season,
      points: 0,
      wins: 0,
      team: race.Constructor,
    };
    season.points += race.points + race.sprintPoints;
    season.wins += race.position === 1 ? 1 : 0;
    season.team = race.Constructor;
    seasons.set(race.season, season);
  });

  return {
    races,
    starts: races.length,
    wins: races.filter((r) => r.position === 1).length,
    podiums: races.filter((r) => r.position >= 1 && r.position <= 3).length,
    poles,
    seasons: [...seasons.values()],
  };
}

// Championship position in one season (0 = not classified)
async function loadDriverSeasonPosition(
  year: number,
  tier: SeasonTier,
  driverId: string,
): Promise<number> {
  "use cache";
  cacheFor(tier);
  const data = await jolpica<StandingsTable<"DriverStandings", DriverStanding>>(
    `${year}/drivers/${driverId}/driverStandings.json`,
    tier,
  );
  const standing =
    data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings[0];
  return Number(standing?.position ?? 0);
}
const getDriverSeasonPosition = bySeason(loadDriverSeasonPosition);

// Championship position in each of the given seasons (one small request each)
export const getDriverSeasonPositions = (driverId: string, seasons: string[]) =>
  Promise.all(
    seasons.map(async (season) => ({
      season,
      position: await getDriverSeasonPosition(season, driverId),
    })),
  );

// Constructors

export type ConstructorInfo = {
  constructor: Constructor;
  seasons: string[];
  wins: number;
};

// Team info, the seasons it raced and its number of wins
export async function getConstructor(
  constructorId: string,
): Promise<ConstructorInfo | null> {
  "use cache";
  cacheFor("lists");
  const [info, seasons, wins] = await Promise.all([
    jolpica<{ MRData: { ConstructorTable: { Constructors: Constructor[] } } }>(
      `constructors/${constructorId}.json`,
      "lists",
    ),
    getAllPages<Paged & { MRData: { SeasonTable: { Seasons: Season[] } } }>(
      `constructors/${constructorId}/seasons.json`,
      "lists",
    ),
    // Only the total is needed
    jolpica<Paged>(`constructors/${constructorId}/results/1.json`, "lists", {
      limit: 1,
    }),
  ]);
  const constructor = info.MRData.ConstructorTable.Constructors[0];
  if (!constructor) return null;
  return {
    constructor,
    seasons: seasons.flatMap((page) =>
      page.MRData.SeasonTable.Seasons.map((s) => s.season),
    ),
    wins: Number(wins.MRData.total),
  };
}

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

// Circuits

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
