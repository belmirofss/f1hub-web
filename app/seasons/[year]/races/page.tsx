import { Suspense } from "react";
import type { Metadata } from "next";
import { Columns } from "@/components/layout/Columns";
import { DriversChampionCard } from "@/components/seasons/ChampionCard";
import { SeasonHeader } from "@/components/seasons/SeasonHeader";
import {
  SeasonRaces,
  SeasonRacesSkeleton,
} from "@/components/seasons/SeasonRaces";
import { getSeasonWinners } from "@/lib/api/jolpica";
import { seasonHref } from "@/lib/domain/routes";
import { getDriverName } from "@/lib/domain/teams";
import { listOf, orFallback, pageMetadata } from "@/lib/metadata";
import { getSeasonInfo } from "@/lib/season";

export const generateMetadata = async ({
  params,
}: PageProps<"/seasons/[year]/races">): Promise<Metadata> => {
  const { year } = await params;
  const { rounds } = await getSeasonInfo(year);
  const winners = (await orFallback(getSeasonWinners(year))) ?? [];

  // "Max Verstappen won the most, 9 of 24."
  let most = "";
  const wins = new Map<string, number>();
  winners.forEach((race) => {
    const driver = race.Results?.[0]?.Driver;
    if (!driver) return;
    const name = getDriverName(driver);
    wins.set(name, (wins.get(name) ?? 0) + 1);
  });
  const top = Math.max(0, ...wins.values());
  const leaders = [...wins].filter(([, count]) => count === top);
  if (top > 1 && leaders.length <= 2) {
    most = ` ${listOf(leaders.map(([name]) => name))} won the most, ${top} ${
      leaders.length > 1 ? "each" : `of ${winners.length}`
    }.`;
  }

  return pageMetadata({
    title: `${year} F1 season: every race and winner`,
    description: `All ${rounds} races of the ${year} Formula 1 season with their dates and winners.${most}`,
    path: `${seasonHref(year)}/races`,
  });
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
