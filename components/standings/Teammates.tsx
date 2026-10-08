// Teammate battles for a season, on the Standings and Season pages
import { io } from "next/cache";
import { Columns } from "@/components/layout/Columns";
import {
  CardSkeleton,
  ListSkeleton,
  LoadingRegion,
} from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import {
  getDriverStandings,
  getSeasonQualifying,
  getSeasonResults,
  type SeasonParam,
} from "@/lib/api/jolpica";
import { getTeammatePairs } from "@/lib/domain/headToHead";
import { TeammateBattles } from "./TeammateBattles";

export const Teammates = async ({ season }: { season: SeasonParam }) => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const [results, qualifying, standings] = await Promise.all([
    getSeasonResults(season),
    getSeasonQualifying(season),
    getDriverStandings(season),
  ]);
  const pairs = getTeammatePairs(
    results,
    qualifying,
    standings?.standings ?? [],
  );
  if (!pairs.length) {
    return <EmptyState>The season hasn&apos;t started yet.</EmptyState>;
  }

  return <TeammateBattles pairs={pairs} />;
};

export const TeammatesSkeleton = () => (
  <LoadingRegion label="Loading teammate battles">
    <Columns
      asideClassName="max-lg:order-first max-lg:basis-full"
      aside={<CardSkeleton lines={5} className="min-h-[420px]" />}
    >
      <ListSkeleton rows={10} />
    </Columns>
  </LoadingRegion>
);
