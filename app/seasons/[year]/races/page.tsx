import { Suspense } from "react";
import type { Metadata } from "next";
import { Columns } from "@/components/layout/Columns";
import { DriversChampionCard } from "@/components/seasons/ChampionCard";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import {
  SeasonRaces,
  SeasonRacesSkeleton,
} from "@/components/seasons/SeasonRaces";
import { getSeasonInfo } from "@/lib/season";

export const generateMetadata = async ({
  params,
}: PageProps<"/seasons/[year]/races">): Promise<Metadata> => {
  const { year } = await params;
  const { rounds } = await getSeasonInfo(year);
  return {
    title: `${year} races`,
    description: `All ${rounds} races of the ${year} Formula 1 season with their dates and winners.`,
  };
};

export default async function SeasonRacesPage({
  params,
}: PageProps<"/seasons/[year]/races">) {
  const { year } = await params;
  const season = await getSeasonInfo(year);

  return (
    <>
      <SeasonHeader season={season} value="races" />
      <Columns
        asideClassName="max-lg:order-first max-lg:basis-full"
        aside={
          season.champion && <DriversChampionCard champion={season.champion} />
        }
      >
        <Suspense fallback={<SeasonRacesSkeleton />}>
          <SeasonRaces year={year} />
        </Suspense>
      </Columns>
    </>
  );
}
