// Ported from the app's src/helpers/championship.ts, plus the what-if verdict
// from its TitleFightCard.
import type { DriverStanding, Race } from "@/lib/api/types";
import { getDriverCode, getDriverName } from "./teams";

// Current points system (from 2025 there's no fastest-lap point)
export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

// Finishing positions offered by the what-if steppers; 11 = outside the points
export const NO_POINTS_POSITION = RACE_POINTS.length + 1;

export const getRacePoints = (position: number) =>
  RACE_POINTS[position - 1] ?? 0;

export type PointsLeft = {
  races: number;
  sprints: number;
  points: number;
};

// Most a driver can still score after `round`: every remaining race and sprint won
export const getPointsLeft = (races: Race[], round: number): PointsLeft => {
  const left = races.filter((race) => Number(race.round) > round);
  const sprints = left.filter((race) => race.Sprint).length;
  return {
    races: left.length,
    sprints,
    points: left.length * RACE_POINTS[0] + sprints * SPRINT_POINTS[0],
  };
};

// One race left and no sprint: the what-if simulator's territory
export const isFinale = (left: PointsLeft) =>
  left.races === 1 && left.sprints === 0;

// More than this and it's not a "fight" worth a card yet (early season)
export const MAX_CONTENDERS = 5;

export type Contender = {
  standing: DriverStanding;
  code: string;
  points: number;
  gap: number;
  needs: string;
};

// Leader's worst finish that still guarantees the title in a one-race finale
const leaderTarget = (leader: number, rivals: number[]) => {
  for (let position = NO_POINTS_POSITION; position >= 1; position--) {
    const rivalBest = RACE_POINTS[position === 1 ? 1 : 0];
    if (
      rivals.every(
        (rival) => leader + getRacePoints(position) > rival + rivalBest,
      )
    ) {
      return position;
    }
  }
};

// Leader's best finish that still lets a rival who wins take the title
const rivalTarget = (leader: number, rival: number) => {
  for (let position = 2; position <= NO_POINTS_POSITION; position++) {
    if (rival + RACE_POINTS[0] > leader + getRacePoints(position))
      return position;
  }
};

const positionLabel = (position: number) =>
  position >= NO_POINTS_POSITION
    ? "out of the points"
    : `P${position} or lower`;

// Drivers who can still reach the leader (a tie goes to countback), with what
// each of them needs in a sentence. Empty once the title is decided.
export const getContenders = (
  standings: DriverStanding[],
  left: PointsLeft,
): Contender[] => {
  if (!left.races || standings.length < 2) return [];

  const leader = Number(standings[0].points);
  const leaderCode = getDriverCode(standings[0].Driver);
  const alive = standings.filter(
    (s) => Number(s.points) + left.points >= leader,
  );
  if (alive.length < 2) return [];

  const finale = isFinale(left);
  const rivals = alive.slice(1).map((s) => Number(s.points));

  return alive.map((standing, index) => {
    const points = Number(standing.points);
    const gap = leader - points;
    let needs: string;

    if (index === 0) {
      const target = finale ? leaderTarget(leader, rivals) : undefined;
      needs = target
        ? target === 1
          ? "Champion with a win, whatever the others do."
          : `Champion with P${target} or better, whatever the others do.`
        : `Leads by ${leader - rivals[0]} with ${left.points} points left.`;
    } else if (finale) {
      const target = rivalTarget(leader, points);
      needs = target
        ? `Must win with ${leaderCode} ${positionLabel(target)}.`
        : "Can only tie on points: would need countback.";
    } else {
      const rounds =
        left.races === 1 ? "the last round" : `the last ${left.races} rounds`;
      needs = `Must outscore ${leaderCode} by ${+gap.toFixed(1)} or more over ${rounds}.`;
    }

    return {
      standing,
      code: getDriverCode(standing.Driver),
      points,
      gap,
      needs,
    };
  });
};

// What-if simulator: each contender starts where they are in the standings
export const getWhatIfStart = (contenders: Contender[]) =>
  Object.fromEntries(contenders.map((c, i) => [c.code, i + 1]));

export const stepWhatIfPosition = (position: number, delta: number) =>
  Math.min(NO_POINTS_POSITION, Math.max(1, position + delta));

export type WhatIfOutcome = {
  totals: (Contender & { total: number })[];
  // Two contenders put in the same points-scoring position
  clash: boolean;
  champion?: Contender & { total: number };
  verdict: string;
};

// Final-round outcome for the finishing positions picked, keyed by driver code
export const getWhatIfOutcome = (
  contenders: Contender[],
  positions: Record<string, number>,
): WhatIfOutcome => {
  const totals = contenders.map((c) => ({
    ...c,
    total: c.points + getRacePoints(positions[c.code]),
  }));
  const placed = contenders
    .map((c) => positions[c.code])
    .filter((p) => p < NO_POINTS_POSITION);
  const clash = new Set(placed).size !== placed.length;
  const best = Math.max(...totals.map((t) => t.total));
  const top = totals.filter((t) => t.total === best);
  const champion = !clash && top.length === 1 ? top[0] : undefined;
  const runnerUp = champion
    ? Math.max(...totals.filter((t) => t !== champion).map((t) => t.total))
    : 0;

  const verdict = clash
    ? "Two drivers can't share a position"
    : champion
      ? `${getDriverName(champion.standing.Driver)} is champion by ${+(best - runnerUp).toFixed(1)}`
      : `Tied on ${best}: decided on countback`;

  return { totals, clash, champion, verdict };
};
