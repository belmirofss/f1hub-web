import "server-only";
import { notFound } from "next/navigation";
import {
  getCurrentSeason,
  getRoundsWithResults,
  getSeasonSchedule,
  LAPS_FIRST_SEASON,
} from "@/lib/api/jolpica";
import { OPENF1_FIRST_SEASON } from "@/lib/api/openf1";
import type { Race } from "@/lib/api/types";
import { findRaceBySlug, getRaceSlug, isSeasonYear } from "@/lib/domain/routes";
import { isSprintWeekend } from "@/lib/domain/sessions";

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
