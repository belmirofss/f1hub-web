import "server-only";
import { notFound } from "next/navigation";
import {
  getCurrentSeason,
  getRoundsWithResults,
  getSeasonPoles,
  getSeasonSchedule,
  getSeasonSprintWinners,
  getSeasonWinners,
  LAPS_FIRST_SEASON,
} from "@/lib/api/jolpica";
import { OPENF1_FIRST_SEASON } from "@/lib/api/openf1";
import type { Race, RaceBase, Result } from "@/lib/api/types";
import { getCircuitTimezone } from "@/lib/domain/circuits";
import { ordinal } from "@/lib/domain/drivers";
import { findRaceBySlug, getRaceSlug, isSeasonYear } from "@/lib/domain/routes";
import { getRaceStart, isSprintWeekend } from "@/lib/domain/sessions";
import { getDriverName } from "@/lib/domain/teams";
import { formatLongDate } from "@/lib/domain/time";
import { listOf, orFallback } from "@/lib/metadata";

// One race weekend (/races/2026/singapore-grand-prix), shared by its layout
// and tabs. Every call is cached, so each page can ask again.

// The race a URL points to, or a 404 for an unknown year or slug
export const getRaceWeekend = async (year: string, slug: string) => {
  if (!isSeasonYear(year)) notFound();
  const season = Number(year);
  // Next year's calendar can be out before the season starts
  if (season > (await getCurrentSeason()) + 1) notFound();

  const races = await getSeasonSchedule(season);
  const race = findRaceBySlug(races, decodeURIComponent(slug));
  if (!race) notFound();

  return { race, races, href: `/races/${year}/${slug}` };
};

export type WeekendTabs = {
  results: boolean;
  qualifying: boolean;
  // Undefined when it isn't a sprint weekend, so there's no Sprint tab
  sprint?: boolean;
  // Lap-by-lap data starts in 1996
  analysis: boolean;
  // OpenF1 has radio from 2023
  radio: boolean;
};

// Which weekend tabs have data. The base route shows the race once results exist.
export const getWeekendTabs = async (race: Race): Promise<WeekendTabs> => {
  const rounds = await getRoundsWithResults(race.season);
  const has = (list: string[]) => list.includes(race.round);

  return {
    results: has(rounds.race),
    qualifying: has(rounds.qualifying),
    sprint: isSprintWeekend(race) ? has(rounds.sprint) : undefined,
    analysis: has(rounds.race) && Number(race.season) >= LAPS_FIRST_SEASON,
    radio: Number(race.season) >= OPENF1_FIRST_SEASON,
  };
};

// The current season's races, prerendered at build time
export const getCurrentRaceParams = async () => {
  const races = await getSeasonSchedule("current");
  return races.map((race) => ({
    year: race.season,
    slug: getRaceSlug(race, races),
  }));
};

// Metadata

// "Singapore Grand Prix 2026"
export const getWeekendName = (race: Race) => `${race.raceName} ${race.season}`;

// "Round 17 of 24 at Marina Bay Street Circuit, Singapore, on 11 Oct 2026",
// with the race day at the track
export const describeWeekend = (race: Race, races: Race[]) => {
  const zone = race.time && getCircuitTimezone(race.Circuit.circuitId);
  const day = formatLongDate(getRaceStart(race), zone || "UTC");
  const { circuitName, Location } = race.Circuit;
  return `Round ${race.round} of ${races.length} at ${circuitName}, ${Location.country}, on ${day}`;
};

// The P1 rows of the weekend: race winner, pole sitter and sprint winner.
// They come from season-wide lists that the tabs already load, so a page's
// metadata costs no request of its own. Null if the lists fail to load.
export const getWeekendPodium = (race: Race) =>
  orFallback(
    (async () => {
      const [winners, poles, sprints] = await Promise.all([
        getSeasonWinners(race.season),
        getSeasonPoles(race.season),
        getSeasonSprintWinners(race.season),
      ]);
      const find = <R extends RaceBase>(list: R[]) =>
        list.find((r) => r.round === race.round);
      return {
        winner: find(winners)?.Results?.[0],
        pole: find(poles)?.QualifyingResults?.[0],
        sprintWinner: find(sprints)?.SprintResults?.[0],
      };
    })(),
  );

// "Max Verstappen won from pole for Red Bull", or "won the sprint from…"
export const describeWin = (result: Result, event?: string) => {
  const grid = Number(result.grid);
  const start =
    grid === 1
      ? "pole"
      : grid
        ? `${ordinal(grid)} on the grid`
        : "the pit lane";
  const won = event ? `won the ${event}` : "won";
  return `${getDriverName(result.Driver)} ${won} from ${start} for ${result.Constructor.name}`;
};

// "full results, qualifying, lap chart, tyre strategy and team radio": what
// the weekend's tabs have, as tyres and radio start in 2023 and laps in 1996
export const describeTabs = (tabs: WeekendTabs) =>
  listOf([
    tabs.sprint ? "race and sprint results" : "full results",
    ...(tabs.qualifying ? ["qualifying"] : []),
    ...(tabs.analysis ? ["lap chart"] : []),
    ...(tabs.analysis && tabs.radio ? ["tyre strategy"] : []),
    ...(tabs.radio ? ["team radio"] : []),
  ]);
