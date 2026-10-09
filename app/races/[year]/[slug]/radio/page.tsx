import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { ContentSkeleton } from "@/components/layout/PageSkeletons";
import { Radio } from "@/components/races/Radio";
import { OPENF1_FIRST_SEASON } from "@/lib/api/openf1";
import type { Race } from "@/lib/api/types";
import { pageMetadata } from "@/lib/metadata";
import {
  getRaceWeekend,
  getWeekendName,
  getWeekendTabs,
} from "@/lib/raceWeekend";

export const generateMetadata = async ({
  params,
}: PageProps<"/races/[year]/[slug]/radio">): Promise<Metadata> => {
  const { year, slug } = await params;
  const { race, href } = await getRaceWeekend(year, slug);
  const { results } = await getWeekendTabs(race);
  return pageMetadata({
    title: `${getWeekendName(race)} team radio`,
    description: `Team radio and race control from the ${getWeekendName(race)} at ${race.Circuit.circuitName}, lap by lap: flags, safety cars, penalties and deleted laps.`,
    path: `${href}/radio`,
    // Nothing to hear until the race has run
    noindex: !results,
  });
};

const RaceRadio = async ({ race }: { race: Race }) => {
  // Request time, so the build doesn't fetch every race's radio
  await io();
  return <Radio race={race} />;
};

export default async function RadioPage({
  params,
}: PageProps<"/races/[year]/[slug]/radio">) {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  // OpenF1 starts in 2023, and the tab is hidden before that
  if (Number(race.season) < OPENF1_FIRST_SEASON) notFound();

  return (
    <Suspense fallback={<ContentSkeleton />}>
      <RaceRadio race={race} />
    </Suspense>
  );
}
