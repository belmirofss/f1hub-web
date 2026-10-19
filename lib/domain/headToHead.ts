// Ported from the app's src/helpers/headToHead.ts.
import type {
  Constructor,
  Driver,
  DriverStanding,
  QualifyingResult,
  QualifyingResults,
  RaceResults,
} from "@/lib/api/types";
import { isClassified, lapTimeToMs } from "./results";

export type Score = [number, number];

export type TeammatePair = {
  team: Constructor;
  a: Driver; // higher in the championship
  b: Driver;
  rounds: number; // races both started for the team
  qualifying: Score;
  race: Score;
  points: Score;
  podiums: Score;
  // Average gap in the last qualifying session both set a time in; negative = a faster
  qualifyingGapMs?: number;
};

// Best time from the furthest session both drivers reached (Q3, then Q2, then Q1)
const sharedSessionGap = (a: QualifyingResult, b: QualifyingResult) => {
  for (const key of ["Q3", "Q2", "Q1"] as const) {
    const timeA = lapTimeToMs(a[key]);
    const timeB = lapTimeToMs(b[key]);
    if (timeA && timeB) return timeA - timeB;
  }
};

// Teammate battles for a season: each team's two most-used drivers, compared
// in the rounds they both raced for it.
export const getTeammatePairs = (
  results: RaceResults[],
  qualifying: QualifyingResults[],
  standings: DriverStanding[],
): TeammatePair[] => {
  const standingByDriver = new Map(
    standings.map((s) => [s.Driver.driverId, s]),
  );
  const teams = new Map<
    string,
    {
      team: Constructor;
      starts: Map<string, { driver: Driver; count: number }>;
    }
  >();

  results.forEach((race) =>
    race.Results?.forEach((result) => {
      const id = result.Constructor.constructorId;
      const team = teams.get(id) ?? {
        team: result.Constructor,
        starts: new Map(),
      };
      const entry = team.starts.get(result.Driver.driverId) ?? {
        driver: result.Driver,
        count: 0,
      };
      entry.count++;
      team.starts.set(result.Driver.driverId, entry);
      teams.set(id, team);
    }),
  );

  const position = (driver: Driver) =>
    Number(standingByDriver.get(driver.driverId)?.position ?? 99);

  const pairs = [...teams.values()].flatMap(({ team, starts }) => {
    const [first, second] = [...starts.values()].sort(
      (x, y) => y.count - x.count,
    );
    if (!first || !second) return [];
    const [a, b] =
      position(first.driver) <= position(second.driver)
        ? [first.driver, second.driver]
        : [second.driver, first.driver];

    const pair: TeammatePair = {
      team,
      a,
      b,
      rounds: 0,
      qualifying: [0, 0],
      race: [0, 0],
      points: [
        Number(standingByDriver.get(a.driverId)?.points ?? 0),
        Number(standingByDriver.get(b.driverId)?.points ?? 0),
      ],
      podiums: [0, 0],
    };

    const forTeam =
      (driver: Driver) => (row: { Driver: Driver; Constructor: Constructor }) =>
        row.Driver.driverId === driver.driverId &&
        row.Constructor.constructorId === team.constructorId;

    results.forEach((race) => {
      const ra = race.Results?.find(forTeam(a));
      const rb = race.Results?.find(forTeam(b));
      if (!ra || !rb) return;
      pair.rounds++;
      const pa = Number(ra.position);
      const pb = Number(rb.position);
      if (isClassified(ra) && pa <= 3) pair.podiums[0]++;
      if (isClassified(rb) && pb <= 3) pair.podiums[1]++;
      // Both retiring counts for nobody; one retiring loses
      if (!isClassified(ra) && !isClassified(rb)) return;
      if (!isClassified(rb) || (isClassified(ra) && pa < pb)) pair.race[0]++;
      else pair.race[1]++;
    });

    const gaps: number[] = [];
    qualifying.forEach((session) => {
      const qa = session.QualifyingResults?.find(forTeam(a));
      const qb = session.QualifyingResults?.find(forTeam(b));
      if (!qa || !qb) return;
      if (Number(qa.position) < Number(qb.position)) pair.qualifying[0]++;
      else pair.qualifying[1]++;
      const gap = sharedSessionGap(qa, qb);
      // Ignore laps ruined by traffic, crashes or changing weather
      if (gap !== undefined && Math.abs(gap) < 2000) gaps.push(gap);
    });
    if (gaps.length)
      pair.qualifyingGapMs = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;

    // The API's qualifying starts in 1994 and has gaps; without a session
    // the starting grid stands in. Grid 0 is a pit-lane start, behind
    // everyone.
    const qualified = new Set(
      qualifying
        .filter((session) => session.QualifyingResults?.length)
        .map((session) => session.round),
    );
    const grid = (row: { grid: string }) => Number(row.grid) || Infinity;
    results.forEach((race) => {
      if (qualified.has(race.round)) return;
      const ra = race.Results?.find(forTeam(a));
      const rb = race.Results?.find(forTeam(b));
      if (!ra || !rb || grid(ra) === grid(rb)) return;
      if (grid(ra) < grid(rb)) pair.qualifying[0]++;
      else pair.qualifying[1]++;
    });

    return [pair];
  });

  // Same order as the constructors' table
  const teamPoints = (pair: TeammatePair) => pair.points[0] + pair.points[1];
  return pairs.sort((x, y) => teamPoints(y) - teamPoints(x));
};

// The most even qualifying battle, for the Home card
export const getClosestPair = (pairs: TeammatePair[]) =>
  pairs
    .filter((p) => p.qualifying[0] + p.qualifying[1] >= 3)
    .sort(
      (x, y) =>
        Math.abs(x.qualifying[0] - x.qualifying[1]) -
          Math.abs(y.qualifying[0] - y.qualifying[1]) ||
        Math.abs(x.qualifyingGapMs ?? 999) - Math.abs(y.qualifyingGapMs ?? 999),
    )[0];
