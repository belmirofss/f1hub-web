import { io } from "next/cache";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import {
  getChampions,
  getConstructorChampionList,
  getConstructorStandings,
  getCurrentSeason,
  getDriverStandings,
  getSeasons,
  getSeasonSchedule,
} from "@/lib/api/jolpica";
import {
  fromConstructorsChampion,
  fromDriversChampion,
  getChampionsGrid,
  getMostTitles,
  getTeamLegend,
  summarizeLeader,
  type ArchiveView,
  type Title,
} from "@/lib/domain/archive";
import { getDriverName } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import { ChampionsGrid } from "./ChampionsGrid";

// Every title of the championship, oldest first, with the champions the API
// adds once a season ends
export const getTitles = async (view: ArchiveView): Promise<Title[]> =>
  view === "drivers"
    ? (await getChampions()).map(fromDriversChampion)
    : (await getConstructorChampionList()).map(fromConstructorsChampion);

// The leader of the season under way, from the standings most pages load
// anyway. Undefined before the first round or if the API fails.
const getLive = (view: ArchiveView) =>
  orFallback(
    (async () => {
      const [standings, races] = await Promise.all([
        view === "drivers"
          ? getDriverStandings("current")
          : getConstructorStandings("current"),
        getSeasonSchedule("current"),
      ]);
      const rows = (standings?.standings ?? []).map((row) => ({
        name:
          "Driver" in row ? getDriverName(row.Driver) : row.Constructor.name,
        points: Number(row.points),
      }));
      const [first, second] = rows;
      if (!standings || !first) return undefined;
      return {
        headline: first.name,
        summary: summarizeLeader({
          name: first.name,
          points: first.points,
          gap: second ? first.points - second.points : 0,
          second: second?.name,
          round: standings.round,
          rounds: races.length,
        }),
      };
    })(),
  );

// "1950–2026" next to the title
export const ArchiveMeta = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const seasons = await getSeasons();
  if (!seasons.length) return null;
  return `${seasons[0].season}–${seasons.at(-1)!.season}`;
};

export const Archive = async ({ view }: { view: ArchiveView }) => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const [seasons, current, titles] = await Promise.all([
    getSeasons(),
    getCurrentSeason(),
    getTitles(view),
  ]);
  if (!seasons.length) return <EmptyState>No seasons found.</EmptyState>;

  const live = titles.some((t) => Number(t.season) === current)
    ? undefined
    : await getLive(view);
  const decades = getChampionsGrid({
    view,
    titles,
    seasons: seasons.map((s) => s.season),
    current,
    live: live ?? undefined,
  });

  return (
    <ChampionsGrid
      // The filter and selection start over with the other championship
      key={view}
      view={view}
      decades={decades}
      initial={titles.at(-1)?.season ?? String(current)}
      most={getMostTitles(titles, view)}
      legend={getTeamLegend(titles)}
    />
  );
};

export const ArchiveSkeleton = () => (
  <LoadingRegion label="Loading seasons" className="flex flex-col gap-6">
    <div className="flex flex-col gap-3 md:flex-row md:justify-between">
      <Skeleton className="h-[46px] w-full rounded-full md:w-64" />
      <Skeleton className="h-[46px] w-full md:w-80" />
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7">
      <div className="flex flex-col gap-[3px] md:gap-[5px]">
        {Array.from({ length: 8 }, (_, row) => (
          <div
            key={row}
            className="grid grid-cols-[30px_repeat(10,minmax(0,1fr))] gap-[3px] md:grid-cols-[52px_repeat(10,minmax(0,1fr))] md:gap-[5px]"
          >
            <span />
            {Array.from({ length: 10 }, (_, cell) => (
              <Skeleton key={cell} className="h-[34px] md:h-[78px]" />
            ))}
          </div>
        ))}
      </div>
      <Skeleton className="h-44 w-full" />
    </div>
  </LoadingRegion>
);
