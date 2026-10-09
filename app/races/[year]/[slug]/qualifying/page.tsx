import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { ContentSkeleton } from "@/components/layout/PageSkeletons";
import { QualifyingTable } from "@/components/races/QualifyingTable";
import { EmptyState } from "@/components/ui/States";
import { getCurrentSeason, getQualifying } from "@/lib/api/jolpica";
import type { Race } from "@/lib/api/types";
import {
  getBestQualifyingTime,
  KNOCKOUT_FIRST_SEASON,
} from "@/lib/domain/results";
import { getDriverName } from "@/lib/domain/teams";
import { pageMetadata } from "@/lib/metadata";
import {
  getRaceWeekend,
  getWeekendName,
  getWeekendPodium,
  getWeekendTabs,
} from "@/lib/raceWeekend";

export const generateMetadata = async ({
  params,
}: PageProps<"/races/[year]/[slug]/qualifying">): Promise<Metadata> => {
  const { year, slug } = await params;
  const { race, href } = await getRaceWeekend(year, slug);
  const [podium, tabs] = await Promise.all([
    getWeekendPodium(race),
    getWeekendTabs(race),
  ]);
  const pole = podium?.pole;
  const time = pole && getBestQualifyingTime(pole);
  const details =
    Number(race.season) >= KNOCKOUT_FIRST_SEASON
      ? "Who made Q3, who went out in Q2 and Q1, best times and gaps."
      : "The grid order, best lap times and gaps to pole.";
  return pageMetadata({
    title: `${getWeekendName(race)} qualifying results`,
    description: pole
      ? `${getDriverName(pole.Driver)} took pole${time ? ` in ${time}` : ""} for ${pole.Constructor.name}. ${details}`
      : `Qualifying results for the ${getWeekendName(race)}: best lap times and gaps to pole.`,
    path: `${href}/qualifying`,
    image: `${href}/opengraph-image`,
    // An empty tab until qualifying, and for good before 1994
    noindex: !tabs.qualifying,
  });
};

const Qualifying = async ({ race }: { race: Race }) => {
  // Request time, so the build doesn't fetch every race's qualifying
  await io();
  const [qualifying, current] = await Promise.all([
    getQualifying(race.season, race.round),
    getCurrentSeason(),
  ]);
  const results = qualifying?.QualifyingResults ?? [];

  if (!results.length) {
    // The API has qualifying from 1994, so older races never get any
    return (
      <EmptyState>
        {Number(race.season) < current
          ? "No qualifying results for this race."
          : "No results yet."}
      </EmptyState>
    );
  }

  return <QualifyingTable race={race} results={results} />;
};

export default async function QualifyingPage({
  params,
}: PageProps<"/races/[year]/[slug]/qualifying">) {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);

  return (
    <Suspense fallback={<ContentSkeleton rows={20} />}>
      <Qualifying race={race} />
    </Suspense>
  );
}
