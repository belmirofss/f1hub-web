import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { ContentSkeleton } from "@/components/layout/PageSkeletons";
import { RaceResults } from "@/components/races/RaceResults";
import { EmptyState } from "@/components/ui/States";
import { getSprint } from "@/lib/api/jolpica";
import type { Race } from "@/lib/api/types";
import { isSprintWeekend } from "@/lib/domain/sessions";
import { pageMetadata } from "@/lib/metadata";
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
  const sprint = await getSprint(race.season, race.round);
  if (!sprint?.SprintResults?.length) {
    return <EmptyState>No results yet.</EmptyState>;
  }

  return (
    <RaceResults race={race} kind="sprint" results={sprint.SprintResults} />
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
