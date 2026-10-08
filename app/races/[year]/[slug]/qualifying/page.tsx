import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { ContentSkeleton } from "@/components/layout/PageSkeletons";
import { QualifyingTable } from "@/components/races/QualifyingTable";
import { EmptyState } from "@/components/ui/States";
import { getCurrentSeason, getQualifying } from "@/lib/api/jolpica";
import type { Race } from "@/lib/api/types";
import { getRaceWeekend } from "@/lib/raceWeekend";

export const generateMetadata = async ({
  params,
}: PageProps<"/races/[year]/[slug]/qualifying">): Promise<Metadata> => {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  return {
    title: `${race.raceName} ${year} qualifying`,
    description: `${race.raceName} ${year} qualifying results: who made Q3, who went out in Q2 and Q1, best times and gaps.`,
  };
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
    <Suspense fallback={<ContentSkeleton />}>
      <Qualifying race={race} />
    </Suspense>
  );
}
