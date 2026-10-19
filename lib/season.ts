import "server-only";
import { notFound } from "next/navigation";
import {
  getChampion,
  getConstructorStandings,
  getCurrentSeason,
  getDriverStandings,
  getSeasonSchedule,
  getSeasons,
  type SeasonParam,
} from "@/lib/api/jolpica";
import { CHAMPIONS, type Champion } from "@/lib/data/champions";
import { formatPoints } from "@/lib/domain/drivers";
import { isSeasonYear } from "@/lib/domain/routes";
import { getDriverName } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";

// One season of the archive (/seasons/2025), shared by its four tabs. Every
// call is cached, so each part of a page can ask again.

export type SeasonInfo = {
  year: string;
  rounds: number;
  // Finished seasons only
  champion?: Champion;
};

// The season a URL points to, or a 404 for a year the API doesn't have.
// Finished seasons in the shipped champions list cost no requests; the rest
// are checked against the API's seasons.
export const getSeasonInfo = async (year: string): Promise<SeasonInfo> => {
  if (!isSeasonYear(year)) notFound();

  const champion = await getChampion(year);
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

// For descriptions: "Lando Norris leads the 2026 drivers' championship on 312
// points, 14 ahead of Oscar Piastri, after round 17 of 24", or "… won the
// 2025 drivers' championship with McLaren on 423 points, 2 ahead of …" once
// the season is over. Null before the first round or if the API fails.
export const describeStandings = (
  season: SeasonParam,
  type: "drivers" | "constructors",
) =>
  orFallback(
    (async () => {
      const [standings, races, current] = await Promise.all([
        type === "drivers"
          ? getDriverStandings(season)
          : getConstructorStandings(season),
        getSeasonSchedule(season),
        getCurrentSeason(),
      ]);
      if (!standings) return null;

      const rows = standings.standings.map((row) =>
        "Driver" in row
          ? {
              name: getDriverName(row.Driver),
              team: row.Constructors.at(-1)?.name,
              points: Number(row.points),
            }
          : {
              name: row.Constructor.name,
              team: undefined,
              points: Number(row.points),
            },
      );
      const [first, second] = rows;
      if (!first) return null;

      const year = standings.season;
      const title = `${year} ${type === "drivers" ? "drivers'" : "constructors'"} championship`;
      const over =
        Number(year) < current || Number(standings.round) === races.length;
      const gap = second ? first.points - second.points : 0;
      const ahead = !second
        ? ""
        : gap
          ? `, ${formatPoints(gap)} ahead of ${second.name}`
          : `, level with ${second.name}`;
      const points = `${formatPoints(first.points)} points`;

      return over
        ? `${first.name} won the ${title}${first.team ? ` with ${first.team}` : ""} on ${points}${ahead}`
        : `${first.name} leads the ${title} on ${points}${ahead}, after round ${standings.round} of ${races.length}`;
    })(),
  );
