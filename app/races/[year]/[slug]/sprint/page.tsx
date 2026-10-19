import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { ContentSkeleton } from "@/components/layout/PageSkeletons";
import { KeyLaps, KeyLapsSkeleton } from "@/components/races/KeyLaps";
import { RaceResults } from "@/components/races/RaceResults";
import { EmptyState } from "@/components/ui/States";
import { getSprint } from "@/lib/api/jolpica";
import { getSprintSession, getStints } from "@/lib/api/openf1";
import type { Race } from "@/lib/api/types";
import { isSprintWeekend } from "@/lib/domain/sessions";
import { orFallback, pageMetadata } from "@/lib/metadata";
import {
  describeWin,
  getRaceWeekend,
  getWeekendName,
  getWeekendPodium,
  getWeekendTabs,
} from "@/lib/raceWeekend";

export const generateMetadata = async ({
  params,
}: PageProps<"/races/[year]/[slug]/sprint">): Promise<Metadata> => {
  const { year, slug } = await params;
  const { race, href } = await getRaceWeekend(year, slug);
  if (!isSprintWeekend(race)) notFound();
  const [podium, tabs] = await Promise.all([
    getWeekendPodium(race),
    getWeekendTabs(race),
  ]);
  const winner = podium?.sprintWinner;
  return pageMetadata({
    title: `${getWeekendName(race)} sprint results`,
    description: `${winner ? `${describeWin(winner, "sprint")}. ` : ""}${getWeekendName(race)} sprint results: places gained, gaps and points.`,
    path: `${href}/sprint`,
    image: `${href}/opengraph-image`,
    noindex: !tabs.sprint,
  });
};

const SprintResults = async ({ race }: { race: Race }) => {
  // Request time, so the build doesn't fetch every sprint
  await io();
  const [sprint, session] = await Promise.all([
    getSprint(race.season, race.round),
    // OpenF1 (2023+) is an extra: without it the table has no stints
    race.Sprint
      ? orFallback(getSprintSession(race.season, race.Sprint.date))
      : null,
  ]);
  const results = sprint?.SprintResults;
  if (!results?.length) {
    return <EmptyState>No results yet.</EmptyState>;
  }
  const stints = session && (await orFallback(getStints(session)));

  return (
    <RaceResults
      race={race}
      kind="sprint"
      results={results}
      stints={stints ?? undefined}
      aside={
        <Suspense fallback={<KeyLapsSkeleton />}>
          <KeyLaps session={session} results={results} />
        </Suspense>
      }
    />
  );
};

export default async function SprintPage({
  params,
}: PageProps<"/races/[year]/[slug]/sprint">) {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  if (!isSprintWeekend(race)) notFound();

  return (
    <Suspense fallback={<ContentSkeleton rows={20} />}>
      <SprintResults race={race} />
    </Suspense>
  );
}
