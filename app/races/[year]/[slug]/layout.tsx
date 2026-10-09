import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RaceTabs } from "@/components/races/RaceTabs";
import { ShareSchedule } from "@/components/races/ShareSchedule";
import { Skeleton } from "@/components/ui/Skeleton";
import { getCurrentSeason } from "@/lib/api/jolpica";
import type { Race } from "@/lib/api/types";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import { circuitHref, seasonHref } from "@/lib/domain/routes";
import { formatRaceDay, getSessions } from "@/lib/domain/sessions";
import {
  getCurrentRaceParams,
  getRaceWeekend,
  getWeekendTabs,
} from "@/lib/raceWeekend";

export const generateStaticParams = getCurrentRaceParams;

export const generateMetadata = async ({
  params,
}: LayoutProps<"/races/[year]/[slug]">): Promise<Metadata> => {
  const { year, slug } = await params;
  const { race } = await getRaceWeekend(year, slug);
  return {
    title: `${race.raceName} ${year}`,
    description: `${race.raceName} ${year} at ${race.Circuit.circuitName}: session times in your time zone, weather forecast, results and analysis.`,
  };
};

// "R17 · SGP · 11 OCT", with the race day at the track
const raceMeta = (race: Race) => {
  const country = getCountryCode3ByName(race.Circuit.Location.country);
  return [`R${race.round}`, country, formatRaceDay(race)]
    .filter(Boolean)
    .join(" · ");
};

const RaceHeader = async ({
  params,
}: Pick<LayoutProps<"/races/[year]/[slug]">, "params">) => {
  const { year, slug } = await params;
  const { race, href } = await getRaceWeekend(year, slug);
  const [available, current] = await Promise.all([
    getWeekendTabs(race),
    getCurrentSeason(),
  ]);
  const seasonLink =
    Number(year) === current ? "/calendar" : `${seasonHref(year)}/races`;

  return (
    <PageHeader
      back="/calendar"
      meta={
        <>
          {/* Desktop has no Back button, so the year leads to the season */}
          <span className="max-lg:hidden">
            <Link href={seasonLink} className="hover:text-text">
              {year}
            </Link>
            {" / "}
          </span>
          {raceMeta(race)}
        </>
      }
      title={race.raceName}
      actions={
        <>
          <Link
            href={circuitHref(race.Circuit.circuitId)}
            className="flex min-h-10 items-center gap-2 rounded-md bg-surface-raised px-3.5 text-sm font-semibold transition-colors hover:bg-line max-lg:hidden"
          >
            <MapIcon aria-hidden size={16} strokeWidth={2} />
            {race.Circuit.Location.locality} circuit
          </Link>
          <ShareSchedule
            title={`${race.raceName} ${race.season}`}
            sessions={getSessions(race).map((session) => ({
              name: session.name,
              start: session.start.toISOString(),
              hasTime: session.hasTime,
            }))}
            className="-mr-2.5 lg:mr-0"
          />
        </>
      }
    >
      <RaceTabs base={href} available={available} />
    </PageHeader>
  );
};

const RaceHeaderSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-3 pt-2 lg:pt-6">
    <Skeleton className="mt-4 h-3 w-32 lg:mt-0" />
    <Skeleton className="mt-1 h-[30px] w-3/5 lg:h-11" />
    <Skeleton className="h-11 w-full" />
  </div>
);

export default function RaceLayout({
  children,
  params,
}: LayoutProps<"/races/[year]/[slug]">) {
  return (
    <>
      <Suspense fallback={<RaceHeaderSkeleton />}>
        <RaceHeader params={params} />
      </Suspense>
      {children}
    </>
  );
}
