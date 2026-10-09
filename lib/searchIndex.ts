import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_LIFE } from "@/lib/api/cacheTiers";
import {
  getAllCircuits,
  getAllConstructors,
  getAllDrivers,
  getCurrentSeason,
  getDriverStandings,
  getSeasonSchedule,
  getSeasons,
} from "@/lib/api/jolpica";
import {
  toIndexCircuit,
  toIndexConstructor,
  toIndexDriver,
  toIndexRace,
  type IndexConstructor,
  type IndexRace,
  type SearchIndexData,
} from "@/lib/domain/search";
import { isSeasonYear } from "@/lib/domain/routes";

// The data behind /search, ported from the app's useSearchIndex hook. It's
// built here once a day and sent as one compact JSON file, so the browser
// makes one request instead of the ~15 the full lists take.
export async function getSearchIndex(): Promise<SearchIndexData> {
  "use cache";
  // Daily, like the full lists. The current season's schedule and grid
  // inside it refresh faster on their own, but rarely change.
  cacheLife(CACHE_LIFE.lists);
  cacheTag("jolpica");

  const [drivers, constructors, circuits, seasons, current] = await Promise.all(
    [
      getAllDrivers(),
      getAllConstructors(),
      getAllCircuits(),
      getSeasons(),
      getCurrentSeason(),
    ],
  );
  const [races, standings] = await Promise.all([
    getSeasonSchedule(current),
    getDriverStandings(current),
  ]);

  // Before the first race there are no standings, so no current grid
  const currentTeams: Record<string, IndexConstructor> = {};
  standings?.standings.forEach((s) => {
    const team = s.Constructors[s.Constructors.length - 1];
    if (team) currentTeams[s.Driver.driverId] = toIndexConstructor(team);
  });

  return {
    drivers: drivers.map(toIndexDriver),
    constructors: constructors.map(toIndexConstructor),
    circuits: circuits.map(toIndexCircuit),
    seasons: seasons.map((s) => s.season),
    currentSeason: String(current),
    currentTeams,
    currentRaces: races.map(toIndexRace),
  };
}

// One season's schedule for "monaco 2024" style queries, or null for a year
// the API doesn't have
export const getYearRaces = async (
  year: string,
): Promise<IndexRace[] | null> => {
  if (!isSeasonYear(year)) return null;
  const seasons = await getSeasons();
  if (!seasons.some((s) => s.season === year)) return null;
  return (await getSeasonSchedule(year)).map(toIndexRace);
};
