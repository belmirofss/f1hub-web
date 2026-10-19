import { Suspense } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { PageHeader } from "@/components/layout/PageHeader";
import { RaceTabs } from "@/components/races/RaceTabs";
import { ShareSchedule } from "@/components/races/ShareSchedule";
import { JsonLd } from "@/components/seo/JsonLd";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getCurrentSeason,
  getQualifying,
  getRaceResults,
} from "@/lib/api/jolpica";
import type { Race } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getRaceHeadlines } from "@/lib/domain/results";
import { circuitHref, seasonHref } from "@/lib/domain/routes";
import { formatRaceDay, getSessions } from "@/lib/domain/sessions";
import { getDriverCode, getDriverName } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import {
  describeWeekend,
  getCurrentRaceParams,
  getRaceWeekend,
  getWeekendTabs,
} from "@/lib/raceWeekend";
import { breadcrumbLd, raceEventLd, seasonCrumbs } from "@/lib/structuredData";

export const generateStaticParams = getCurrentRaceParams;

// The race's laps once it has run: " · 62 LAPS"
const RaceLaps = async ({ race }: { race: Race }) => {
  // Request time, so the build doesn't fetch every race's results
  await io();
  const results = await orFallback(getRaceResults(race.season, race.round));
  const laps = results?.Results?.[0]?.laps;
  return laps ? ` · ${laps} LAPS` : null;
};

// "ROUND 17 · MARINA BAY · 11 OCT · 62 LAPS" ("R17 · …" on phones), with the
// race day at the track. The place links to the circuit.
const RaceMeta = ({ race }: { race: Race }) => (
  <>
    <span className="lg:hidden">R</span>
    <span className="max-lg:hidden">ROUND </span>
    {race.round} ·{" "}
    <Link
      href={circuitHref(race.Circuit.circuitId)}
      className="uppercase hover:text-text hover:underline"
    >
      {race.Circuit.Location.locality}
    </Link>{" "}
    · {formatRaceDay(race)}
    <span className="max-lg:hidden">
      <Suspense fallback={null}>
        <RaceLaps race={race} />
      </Suspense>
    </span>
  </>
);

// Pole, fastest lap and top gainer beside the title on desktop. Phones have
// them above the results table instead.
const HeadlineStats = async ({ race }: { race: Race }) => {
  // Request time, so the build doesn't fetch every race's results
  await io();
  const [results, qualifying] = await Promise.all([
    orFallback(getRaceResults(race.season, race.round)),
    orFallback(getQualifying(race.season, race.round)),
  ]);
  if (!results?.Results?.length) return null;
  const { pole, fastest, gainer } = getRaceHeadlines(
    results.Results,
    qualifying?.QualifyingResults?.[0],
  );

  const stats = [
    pole && {
      label: "Pole",
      driver: pole.driver,
      value: pole.time,
    },
    fastest && {
      label: "Fastest lap",
      driver: fastest.driver,
      value: fastest.time,
      className: "text-purple",
    },
    gainer && {
      label: "Top gainer",
      driver: gainer.result.Driver,
      value: `▲${gainer.gained}`,
      className: "text-accent-ink",
    },
  ].filter((stat) => !!stat);

  return (
    <dl
      aria-label="Race headlines"
      className="flex gap-5 font-mono text-xs max-lg:hidden"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-end gap-0.5">
          <dt className="text-[10px] tracking-[0.14em] text-muted uppercase">
            {stat.label}
          </dt>
          <dd className={cn("font-bold whitespace-nowrap", stat.className)}>
            <span aria-hidden>{getDriverCode(stat.driver)}</span>
            <span className="sr-only">{getDriverName(stat.driver)}</span>
            {stat.value && ` ${stat.value}`}
          </dd>
        </div>
      ))}
    </dl>
  );
};

const RaceHeader = async ({
  params,
}: Pick<LayoutProps<"/races/[year]/[slug]">, "params">) => {
  const { year, slug } = await params;
  const { race, races, href } = await getRaceWeekend(year, slug);
  const [available, current] = await Promise.all([
    getWeekendTabs(race),
    getCurrentSeason(),
  ]);
  const seasonLink =
    Number(year) === current ? "/calendar" : `${seasonHref(year)}/races`;

  return (
    <>
      <JsonLd
        data={[
          raceEventLd(race, href, describeWeekend(race, races)),
          breadcrumbLd([
            ...seasonCrumbs(year),
            { name: race.raceName, path: href },
          ]),
        ]}
      />
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
            <RaceMeta race={race} />
          </>
        }
        title={race.raceName}
        // Shorter than other pages, so a full results table fits on a
        // 900px-tall screen under it
        className="lg:gap-2 lg:pt-4"
        titleClassName="lg:text-5xl"
        actions={
          <>
            <Suspense fallback={null}>
              <HeadlineStats race={race} />
            </Suspense>
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
    </>
  );
};

const RaceHeaderSkeleton = () => (
  <div aria-hidden className="flex flex-col gap-3 pt-2 lg:gap-2 lg:pt-4">
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
