// Ported from the app's src/helpers/results.ts.
import type { Result } from "@/lib/api/types";

// Finishers have a number; "R", "D", "W", "N", "E" mean retired, disqualified…
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
