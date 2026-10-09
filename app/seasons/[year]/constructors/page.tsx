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
import { getSeasonInfo } from "@/lib/season";

// The constructors' championship started in 1958
const FIRST_CONSTRUCTORS_SEASON = 1958;

export const generateMetadata = async ({
  params,
}: PageProps<"/seasons/[year]/constructors">): Promise<Metadata> => {
  const { year } = await params;
  await getSeasonInfo(year);
  return {
    title: `${year} constructors' championship`,
    description: `The ${year} Formula 1 constructors' championship: points, wins and each team's drivers.`,
  };
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
