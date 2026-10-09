import { Suspense } from "react";
import type { Metadata } from "next";
import { Columns } from "@/components/layout/Columns";
import {
  ConstructorsChampionCard,
  DriversChampionCard,
} from "@/components/seasons/ChampionCard";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import {
  StandingsTable,
  StandingsTableSkeleton,
} from "@/components/standings/StandingsTable";
import { SilentBoundary } from "@/components/ui/CardBoundary";
import { EmptyState } from "@/components/ui/States";
import { seasonHref } from "@/lib/domain/routes";
import { pageMetadata } from "@/lib/metadata";
import {
  describeStandings,
  FIRST_CONSTRUCTORS_SEASON,
  getSeasonInfo,
} from "@/lib/season";

export const generateMetadata = async ({
  params,
}: PageProps<"/seasons/[year]/constructors">): Promise<Metadata> => {
  const { year } = await params;
  await getSeasonInfo(year);
  const path = `${seasonHref(year)}/constructors`;
  if (Number(year) < FIRST_CONSTRUCTORS_SEASON) {
    return pageMetadata({
      title: `${year} F1 season: constructors`,
      description: `The constructors' championship started in ${FIRST_CONSTRUCTORS_SEASON}, so the ${year} Formula 1 season has no team standings.`,
      path,
      noindex: true,
    });
  }
  const summary = await describeStandings(year, "constructors");
  return pageMetadata({
    title: `${year} F1 season: constructors' championship standings`,
    description: summary
      ? `${summary}. Points, wins and each team's drivers.`
      : `The ${year} Formula 1 constructors' standings: points, wins and each team's drivers.`,
    path,
  });
};

export default async function SeasonConstructorsPage({
  params,
}: PageProps<"/seasons/[year]/constructors">) {
  const { year } = await params;
  const season = await getSeasonInfo(year);
  const hasTitle = Number(year) >= FIRST_CONSTRUCTORS_SEASON;

  return (
    <>
      <SeasonHeader season={season} value="constructors" />
      <Columns
        asideClassName="max-lg:order-first max-lg:basis-full"
        aside={
          (season.champion || hasTitle) && (
            <>
              {hasTitle && (
                <SilentBoundary>
                  <Suspense fallback={null}>
                    <ConstructorsChampionCard year={year} />
                  </Suspense>
                </SilentBoundary>
              )}
              {season.champion && (
                <DriversChampionCard champion={season.champion} />
              )}
            </>
          )
        }
      >
        {hasTitle ? (
          <Suspense fallback={<StandingsTableSkeleton />}>
            <StandingsTable season={year} type="constructors" />
          </Suspense>
        ) : (
          <EmptyState>
            The constructors&apos; championship started in{" "}
            {FIRST_CONSTRUCTORS_SEASON}.
          </EmptyState>
        )}
      </Columns>
    </>
  );
}
