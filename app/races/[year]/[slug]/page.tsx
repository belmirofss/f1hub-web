import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { ContentSkeleton } from "@/components/layout/PageSkeletons";
import { KeyLaps, KeyLapsSkeleton } from "@/components/races/KeyLaps";
import { RaceResults } from "@/components/races/RaceResults";
import { Schedule } from "@/components/races/Schedule";
import { EmptyState } from "@/components/ui/States";
import { getQualifying, getRaceResults } from "@/lib/api/jolpica";
import { getRaceSession, getStints } from "@/lib/api/openf1";
import type { Race } from "@/lib/api/types";
import { orFallback, pageMetadata } from "@/lib/metadata";
import {
  describeTabs,
  describeWeekend,
  describeWin,
  getRaceWeekend,
  getWeekendName,
  getWeekendPodium,
  getWeekendTabs,
} from "@/lib/raceWeekend";

export const generateMetadata = async ({
  params,
}: PageProps<"/races/[year]/[slug]">): Promise<Metadata> => {
  const { year, slug } = await params;
  const { race, races, href } = await getRaceWeekend(year, slug);
  const [podium, tabs] = await Promise.all([
    getWeekendPodium(race),
    getWeekendTabs(race),
  ]);
  const where = describeWeekend(race, races);
  return pageMetadata({
    title: `${getWeekendName(race)}: schedule, results and analysis`,
    description: podium?.winner
      ? `${describeWin(podium.winner)}. ${where}: ${describeTabs(tabs)}.`
      : `${where}. Session times in your time zone, the weather forecast, then results and analysis.`,
    path: href,
    image: `${href}/opengraph-image`,
  });
};

const Results = async ({ race, href }: { race: Race; href: string }) => {
  // Request time, so the build doesn't fetch every race's results
  await io();
  const [raceResults, qualifying, session] = await Promise.all([
    getRaceResults(race.season, race.round),
    getQualifying(race.season, race.round),
    // OpenF1 (2023+) is an extra: without it the table has no stints
    orFallback(getRaceSession(race.season, race.date)),
  ]);
  const results = raceResults?.Results;
  if (!results?.length) {
    return <EmptyState>No results yet.</EmptyState>;
  }
  const stints = session && (await orFallback(getStints(session)));

  return (
    <RaceResults
      race={race}
      kind="race"
      results={results}
      pole={qualifying?.QualifyingResults?.[0]}
      stints={stints ?? undefined}
      aside={
        <Suspense fallback={<KeyLapsSkeleton />}>
          <KeyLaps
            session={session}
            results={results}
            radioHref={`${href}/radio`}
          />
        </Suspense>
      }
    />
  );
};

// The race once there are results, the schedule until then
export default async function RaceWeekendPage({
  params,
}: PageProps<"/races/[year]/[slug]">) {
  const { year, slug } = await params;
  const { race, href } = await getRaceWeekend(year, slug);
  const { results } = await getWeekendTabs(race);

  if (!results) return <Schedule race={race} />;

  return (
    <Suspense fallback={<ContentSkeleton rows={20} />}>
      <Results race={race} href={href} />
    </Suspense>
  );
}
