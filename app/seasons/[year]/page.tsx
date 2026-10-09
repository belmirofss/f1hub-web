import { Suspense } from "react";
import type { Metadata } from "next";
import { Columns } from "@/components/layout/Columns";
import {
  DriversChampionCard,
  SeasonInProgressCard,
} from "@/components/seasons/ChampionCard";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import {
  StandingsTable,
  StandingsTableSkeleton,
} from "@/components/standings/StandingsTable";
import { SilentBoundary } from "@/components/ui/CardBoundary";
import { getSeasonInfo } from "@/lib/season";

export const generateMetadata = async ({
  params,
}: PageProps<"/seasons/[year]">): Promise<Metadata> => {
  const { year } = await params;
  const { champion } = await getSeasonInfo(year);
  return {
    title: `${year} drivers' championship`,
    description: champion
      ? `The ${year} Formula 1 season: ${champion.driver} won the drivers' title with ${champion.team}. Final standings, points and wins.`
      : `The ${year} Formula 1 drivers' championship: points, wins and last-5 form.`,
  };
};

export default async function SeasonDriversPage({
  params,
}: PageProps<"/seasons/[year]">) {
  const { year } = await params;
  const season = await getSeasonInfo(year);

  return (
    <>
      <SeasonHeader season={season} value="drivers" />
      {/* Phones show the champion above the table, desktop beside it */}
      <Columns
        asideClassName="max-lg:order-first max-lg:basis-full"
        aside={
          season.champion ? (
            <DriversChampionCard champion={season.champion} />
          ) : (
            <SilentBoundary>
              <Suspense fallback={null}>
                <SeasonInProgressCard year={year} />
              </Suspense>
            </SilentBoundary>
          )
        }
      >
        <Suspense fallback={<StandingsTableSkeleton />}>
          <StandingsTable season={year} type="drivers" />
        </Suspense>
      </Columns>
    </>
  );
}
