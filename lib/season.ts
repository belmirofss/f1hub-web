import "server-only";
import { notFound } from "next/navigation";
import { getSeasonSchedule, getSeasons } from "@/lib/api/jolpica";
import { CHAMPIONS, type Champion } from "@/lib/data/champions";
import { isSeasonYear } from "@/lib/domain/routes";

// One season of the archive (/seasons/2025), shared by its four tabs. Every
// call is cached, so each part of a page can ask again.

export type SeasonInfo = {
  year: string;
  rounds: number;
  // Finished seasons only
  champion?: Champion;
};

// The season a URL points to, or a 404 for a year the API doesn't have.
// Finished seasons come from the shipped champions list, so they cost no
// requests; the rest are checked against the API's seasons.
export const getSeasonInfo = async (year: string): Promise<SeasonInfo> => {
  if (!isSeasonYear(year)) notFound();

  const champion = CHAMPIONS.find((c) => c.season === year);
  if (champion) return { year, rounds: champion.rounds, champion };

  const seasons = await getSeasons();
  if (!seasons.some((s) => s.season === year)) notFound();
  const races = await getSeasonSchedule(year);
  return { year, rounds: races.length };
};

// The last few finished seasons, prerendered at build time from the shipped
// data. Every other season renders on its first visit.
export const getRecentSeasonParams = () =>
  CHAMPIONS.slice(-3).map((c) => ({ year: c.season }));
