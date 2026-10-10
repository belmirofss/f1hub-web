// Ported from the app's src/helpers/results.ts.
import type { QualifyingResult, Result } from "@/lib/api/types";

// Finishers have a number; "R", "D", "W", "N", "E", "F" mean retired, disqualified…
export const isClassified = (result: Pick<Result, "positionText">) =>
  /^\d+$/.test(result.positionText);

// "Collision", "+1 Lap", "Lapped"… shown when a driver has no time
export const getStatusLabel = (result: Result) => {
  if (!isClassified(result)) {
    const short: Record<string, string> = {
      D: "DSQ",
      W: "DNS",
      N: "NC",
      E: "EXC",
      F: "DNQ",
    };
    return short[result.positionText] ?? "DNF";
  }
  return result.status;
};

export const getGridPosition = (result: Result, fieldSize: number) => {
  const grid = Number(result.grid);
  return grid > 0 ? grid : fieldSize; // 0 = pit lane start
};

export const getPlacesGained = (result: Result, fieldSize: number) => {
  if (!isClassified(result)) return 0;
  return getGridPosition(result, fieldSize) - Number(result.position);
};

const formatSeconds = (seconds: number) => {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    return `+${minutes}:${(seconds % 60).toFixed(3).padStart(6, "0")}`;
  }
  return `+${seconds.toFixed(3)}`;
};

// Classified drivers can still have no time (lapped, or retired late in the
// race), so fall back to laps down, then to the status.
export const getGapToLeader = (result: Result, leader?: Result) => {
  if (result.Time?.time) return result.Time.time;
  if (!isClassified(result)) return getStatusLabel(result);
  const lapsDown = leader ? Number(leader.laps) - Number(result.laps) : 0;
  if (lapsDown > 0) return `+${lapsDown} ${lapsDown === 1 ? "lap" : "laps"}`;
  return result.status;
};

export const getFastestLap = (results: Result[]) =>
  results.find((r) => r.FastestLap?.rank === "1");

export const getTopGainer = (results: Result[]) => {
  const size = results.length;
  return results
    .filter(isClassified)
    .map((result) => ({ result, gained: getPlacesGained(result, size) }))
    .sort((a, b) => b.gained - a.gained)[0];
};

// Parses "1:41.365" / "58.402" into milliseconds
export const lapTimeToMs = (time?: string) => {
  if (!time) return undefined;
  const [a, b] = time.split(":");
  const seconds = b === undefined ? Number(a) : Number(a) * 60 + Number(b);
  return Number.isNaN(seconds) ? undefined : seconds * 1000;
};

export const formatGapMs = (ms: number) => formatSeconds(ms / 1000);

// Qualifying

export type QualifyingSession = "Q1" | "Q2" | "Q3";

export const getBestQualifyingTime = (result: QualifyingResult) =>
  result.Q3 || result.Q2 || result.Q1 || undefined;

export type QualifyingGroup = {
  key: "q3" | "q2" | "q1" | "none" | "all";
  title: string;
  // The session the gaps in this group are measured in
  session?: QualifyingSession;
  results: QualifyingResult[];
};

// Knockout qualifying (Q1, Q2, Q3) started in 2006
export const KNOCKOUT_FIRST_SEASON = 2006;

// Fastest time anyone set in a session, in ms
export const getSessionFastestMs = (
  results: QualifyingResult[],
  session: QualifyingSession,
) => {
  const times = results
    .map((result) => lapTimeToMs(result[session]))
    .filter((time): time is number => !!time);
  return times.length ? Math.min(...times) : undefined;
};

// Splits the order into the session each driver reached. A driver who made
// Q2 but set no time there still has an empty Q2, so it's the field being
// there that counts, not the time. Before knockout qualifying everyone is one
// group, with gaps in the last session that had times.
export const groupQualifying = (
  results: QualifyingResult[],
  season: number,
): QualifyingGroup[] => {
  if (season < KNOCKOUT_FIRST_SEASON) {
    const session = results.some((r) => r.Q2) ? "Q2" : "Q1";
    return [{ key: "all", title: "Qualifying", session, results }];
  }

  const timed = results.filter(getBestQualifyingTime);
  const groups: QualifyingGroup[] = [
    {
      key: "q3",
      title: "Q3",
      session: "Q3",
      results: timed.filter((r) => r.Q3 !== undefined),
    },
    {
      key: "q2",
      title: "Out in Q2",
      session: "Q2",
      results: timed.filter((r) => r.Q3 === undefined && r.Q2 !== undefined),
    },
    {
      key: "q1",
      title: "Out in Q1",
      session: "Q1",
      results: timed.filter((r) => r.Q3 === undefined && r.Q2 === undefined),
    },
    {
      key: "none",
      title: "No time",
      results: results.filter((r) => !getBestQualifyingTime(r)),
    },
  ];
  return groups.filter((group) => group.results.length > 0);
};

// Pole, fastest lap and top gainer: the race's headline numbers. Without
// qualifying times (sprints, races before 1994) pole is the front of the grid.
export const getRaceHeadlines = (
  results: Result[],
  pole?: QualifyingResult,
) => {
  const fastest = getFastestLap(results);
  const gainer = getTopGainer(results);
  const poleDriver =
    pole?.Driver ?? results.find((r) => r.grid === "1")?.Driver;

  return {
    pole: poleDriver && {
      driver: poleDriver,
      time: pole && getBestQualifyingTime(pole),
    },
    fastest: fastest?.FastestLap && {
      driver: fastest.Driver,
      time: fastest.FastestLap.Time.time,
      lap: fastest.FastestLap.lap,
    },
    gainer: gainer && gainer.gained > 0 ? gainer : undefined,
  };
};
