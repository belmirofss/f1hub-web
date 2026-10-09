import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { ContentSkeleton } from "@/components/layout/PageSkeletons";
import { Analysis } from "@/components/races/Analysis";
import { EmptyState } from "@/components/ui/States";
import {
  getPitStops,
  getRaceResults,
  LAPS_FIRST_SEASON,
  PIT_STOPS_FIRST_SEASON,
} from "@/lib/api/jolpica";
import { OPENF1_FIRST_SEASON } from "@/lib/api/openf1";
import type { Race } from "@/lib/api/types";
import { getRaceWeekend } from "@/lib/raceWeekend";

export const generateMetadata = async ({
  params,
}: PageProps<"/races/[year]/[slug]/analysis">): Promise<Metadata> => {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  return {
    title: `${race.raceName} ${year} analysis`,
    description: `${race.raceName} ${year} lap by lap: position chart, tyre strategy and the fastest pit stops.`,
  };
};

const RaceAnalysis = async ({ race }: { race: Race }) => {
  // Request time, so the build doesn't fetch every race's laps
  await io();
  const season = Number(race.season);
  const [raceResults, pitStops] = await Promise.all([
    getRaceResults(race.season, race.round),
    // Pit stops are an extra: without them the card just doesn't show
    season >= PIT_STOPS_FIRST_SEASON
      ? getPitStops(race.season, race.round).catch(() => [])
      : [],
  ]);
  const results = raceResults?.Results ?? [];
  if (!results.length) return <EmptyState>No results yet.</EmptyState>;
  if (season < LAPS_FIRST_SEASON) {
    return (
      <EmptyState>Lap-by-lap data starts in {LAPS_FIRST_SEASON}.</EmptyState>
    );
  }

  return (
    <Analysis
      race={race}
      results={results}
      pitStops={pitStops}
      tyres={season >= OPENF1_FIRST_SEASON}
    />
  );
};

export default async function AnalysisPage({
  params,
}: PageProps<"/races/[year]/[slug]/analysis">) {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);

  return (
    <Suspense fallback={<ContentSkeleton />}>
      <RaceAnalysis race={race} />
    </Suspense>
  );
}
