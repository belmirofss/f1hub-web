import { io } from "next/cache";
import {
  ListSkeleton,
  LoadingRegion,
  Skeleton,
} from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { getChampions, getCurrentSeason, getSeasons } from "@/lib/api/jolpica";
import { seasonHref } from "@/lib/domain/routes";
import { getTeamColor } from "@/lib/domain/teams";
import { ArchiveList, type ArchiveRow } from "./ArchiveList";

// Every season the API has, newest first, with its champion
const getRows = async (): Promise<ArchiveRow[]> => {
  const [seasons, current, champions] = await Promise.all([
    getSeasons(),
    getCurrentSeason(),
    getChampions(),
  ]);
  const championBySeason = new Map(champions.map((c) => [c.season, c]));

  return seasons.toReversed().map(({ season }) => {
    const champion = championBySeason.get(season);
    if (!champion) {
      return {
        season,
        href: seasonHref(season),
        champion: Number(season) > current ? "Upcoming" : "In progress",
      };
    }
    return {
      season,
      href: seasonHref(season),
      champion: champion.driver,
      team: champion.team,
      teamColor: getTeamColor(champion.teamId),
      wins: champion.wins,
      points: champion.points,
    };
  });
};

// "1950–2026" next to the title
export const ArchiveMeta = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const seasons = await getSeasons();
  if (!seasons.length) return null;
  return `${seasons[0].season}–${seasons.at(-1)!.season}`;
};

export const Archive = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const rows = await getRows();
  if (!rows.length) return <EmptyState>No seasons found.</EmptyState>;
  return <ArchiveList rows={rows} />;
};

export const ArchiveSkeleton = () => (
  <LoadingRegion
    label="Loading seasons"
    className="flex flex-col gap-3.5 lg:gap-5"
  >
    <Skeleton className="h-[46px] w-full rounded-[10px] lg:max-w-md" />
    <ListSkeleton rows={12} />
  </LoadingRegion>
);
