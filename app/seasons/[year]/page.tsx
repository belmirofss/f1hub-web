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
import { seasonHref } from "@/lib/domain/routes";
import { pageMetadata } from "@/lib/metadata";
import { describeStandings, getSeasonInfo } from "@/lib/season";

export const generateMetadata = async ({
  params,
}: PageProps<"/seasons/[year]">): Promise<Metadata> => {
  const { year } = await params;
  await getSeasonInfo(year);
  const summary = await describeStandings(year, "drivers");
  return pageMetadata({
    title: `${year} F1 season: drivers' championship standings`,
    description: summary
      ? `${summary}. Points, wins and form for every driver.`
      : `The ${year} Formula 1 drivers' standings: points, wins and last-5 form for every driver.`,
    path: seasonHref(year),
    image: `${seasonHref(year)}/opengraph-image`,
  });
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
