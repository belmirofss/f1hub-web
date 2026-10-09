import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Columns } from "@/components/layout/Columns";
import { DetailPageSkeleton } from "@/components/layout/PageSkeletons";
import {
  AllTimeStats,
  AllTimeStatsSkeleton,
} from "@/components/teams/AllTimeStats";
import {
  PointsPerRound,
  PointsPerRoundSkeleton,
} from "@/components/teams/PointsPerRound";
import {
  PositionHistory,
  PositionHistorySkeleton,
} from "@/components/teams/PositionHistory";
import {
  TeamDrivers,
  TeamDriversSkeleton,
} from "@/components/teams/TeamDrivers";
import { TeamHero } from "@/components/teams/TeamHero";
import { TeammateLink } from "@/components/teams/TeammateLink";
import { Slot } from "@/components/ui/Slot";
import { TitlesCard } from "@/components/ui/TitlesCard";
import { getConstructor, getConstructorSeasons } from "@/lib/api/jolpica";
import type { Constructor } from "@/lib/api/types";
import { getConstructorTitles } from "@/lib/data/constructorChampions";

// Constructor ids are lowercase words joined by "_" or "-" ("red_bull",
// "brabham-repco")
const findTeam = async (param: string) => {
  const constructorId = decodeURIComponent(param);
  if (!/^[a-z0-9_-]+$/.test(constructorId)) notFound();
  const team = await getConstructor(constructorId);
  if (!team) notFound();
  return team;
};

export const generateMetadata = async ({
  params,
}: PageProps<"/teams/[constructorId]">): Promise<Metadata> => {
  const team = await findTeam((await params).constructorId);
  const titles = getConstructorTitles(team.constructorId).length;
  const champion = titles ? `, ${titles}× constructors' champion` : "";
  return {
    title: team.name,
    description: `${team.name}, ${team.nationality} Formula 1 team${champion}: drivers, all-time stats, points per round and constructors' championship history.`,
  };
};

// The page waits for this one cached request before it starts streaming, so
// an unknown team gets a real 404 instead of a 200 with a not-found page.
// That makes it a blocking route rather than an instant App Shell.
export const instant = false;

export default async function TeamPage({
  params,
}: PageProps<"/teams/[constructorId]">) {
  const team = await findTeam((await params).constructorId);

  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <TeamContent team={team} />
    </Suspense>
  );
}

// Everything that needs the team's seasons
const TeamContent = async ({ team }: { team: Constructor }) => {
  const { constructorId } = team;
  const seasons = await getConstructorSeasons(constructorId);
  const latest = seasons.at(-1);
  const titles = getConstructorTitles(constructorId);

  return (
    <>
      <TeamHero team={team} seasons={seasons} />
      <Columns
        asideLabel="Championship history and teammates"
        aside={
          <>
            <Slot fallback={<PositionHistorySkeleton />}>
              <PositionHistory
                constructorId={constructorId}
                seasons={seasons}
                titles={titles}
              />
            </Slot>
            {latest && (
              <Slot fallback={null}>
                <TeammateLink constructorId={constructorId} season={latest} />
              </Slot>
            )}
          </>
        }
      >
        <TitlesCard titles={titles} champion="Constructors' Champions" />
        {latest && (
          <Slot label="Drivers" fallback={<TeamDriversSkeleton />}>
            <TeamDrivers constructorId={constructorId} season={latest} />
          </Slot>
        )}
        <Slot label="All time" fallback={<AllTimeStatsSkeleton />}>
          <AllTimeStats
            constructorId={constructorId}
            seasons={seasons}
            titles={titles}
          />
        </Slot>
        {latest && (
          <Slot fallback={<PointsPerRoundSkeleton />}>
            <PointsPerRound constructorId={constructorId} season={latest} />
          </Slot>
        )}
      </Columns>
    </>
  );
};
