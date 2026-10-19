import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { CircuitFacts } from "@/components/circuits/CircuitFacts";
import { LapRecord } from "@/components/circuits/LapRecord";
import { MostWins } from "@/components/circuits/MostWins";
import {
  RecentWinners,
  RecentWinnersSkeleton,
} from "@/components/circuits/RecentWinners";
import { SeasonWeekendLink } from "@/components/circuits/SeasonWeekendLink";
import {
  TrackMapCard,
  TrackMapSkeleton,
} from "@/components/circuits/TrackMapCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrackHeroSkeleton } from "@/components/layout/PageSkeletons";
import { JsonLd } from "@/components/seo/JsonLd";
import { InlineLink } from "@/components/ui/Card";
import { Slot } from "@/components/ui/Slot";
import {
  getCircuit,
  getCircuitHistory,
  getSeasonSchedule,
} from "@/lib/api/jolpica";
import { OPENF1_FIRST_SEASON } from "@/lib/api/openf1";
import type { Circuit } from "@/lib/api/types";
import { getCircuitTags, getWinsByDriver } from "@/lib/domain/circuits";
import { circuitHref } from "@/lib/domain/routes";
import { getDriverName } from "@/lib/domain/teams";
import { orFallback, pageMetadata, plural } from "@/lib/metadata";
import { breadcrumbLd, circuitLd } from "@/lib/structuredData";

// Circuit ids are lowercase words joined by "_" ("marina_bay"). This
// season's come with its schedule, so prerendering them asks the API for
// nothing more.
const findCircuit = async (param: string) => {
  const circuitId = decodeURIComponent(param);
  if (!/^[a-z0-9_-]+$/.test(circuitId)) notFound();
  const races = await getSeasonSchedule("current");
  const circuit =
    races.find((race) => race.Circuit.circuitId === circuitId)?.Circuit ??
    (await getCircuit(circuitId));
  if (!circuit) notFound();
  return circuit;
};

export const generateMetadata = async ({
  params,
}: PageProps<"/circuits/[circuitId]">): Promise<Metadata> => {
  const { circuitId, circuitName, Location } = await findCircuit(
    (await params).circuitId,
  );
  // Request time, like the page's content
  await io();
  const races = (await orFallback(getCircuitHistory(circuitId)))?.races ?? [];
  const where = `${circuitName} in ${Location.locality}, ${Location.country}`;

  // "has hosted 16 Formula 1 races, the first in 2008. Most wins: …"
  const facts: string[] = [];
  if (races.length) {
    const first = races[0].season;
    facts.push(
      races.length === 1
        ? `${where} hosted its first Formula 1 race in ${first}.`
        : `${where} has hosted ${plural(races.length, "Formula 1 race")}, the first in ${first}.`,
    );
    const [most] = getWinsByDriver(races);
    if (most && most.wins > 1) {
      facts.push(`Most wins: ${getDriverName(most.driver)} (${most.wins}).`);
    }
  } else {
    facts.push(`${where}.`);
  }

  return pageMetadata({
    title: `${circuitName}: F1 track map, facts and winners`,
    description: `${facts.join(" ")} Track map, lap length, fastest race lap and recent winners.`,
    path: circuitHref(circuitId),
    image: `${circuitHref(circuitId)}/opengraph-image`,
  });
};

// This season's circuits, prerendered at build time: the home page and the
// calendar link to them, and their prefetch then brings the page's shell,
// so they open at once and the content streams in
export const generateStaticParams = async () => {
  const races = await getSeasonSchedule("current");
  return [...new Set(races.map((race) => race.Circuit.circuitId))].map(
    (circuitId) => ({ circuitId }),
  );
};

// Any other circuit waits for this one cached request before it starts
// streaming, so an unknown circuit gets a real 404 instead of a 200 with a
// not-found page. That makes it a blocking route rather than an instant App
// Shell.
export const instant = false;

export default async function CircuitPage({
  params,
}: PageProps<"/circuits/[circuitId]">) {
  const circuit = await findCircuit((await params).circuitId);

  return (
    <>
      <JsonLd
        data={[
          circuitLd(circuit),
          breadcrumbLd([
            {
              name: circuit.circuitName,
              path: circuitHref(circuit.circuitId),
            },
          ]),
        ]}
      />
      <Suspense fallback={<TrackHeroSkeleton />}>
        <CircuitContent circuit={circuit} />
      </Suspense>
    </>
  );
}

// Everything that needs the races held here: the "since" year in the
// header, the map, the facts and the winners. "Track Hero": the map takes
// the page and the rest sits in a panel beside it, or under it on phones.
// Circuits OpenF1 never covered get the panel full width and no map box.
const CircuitContent = async ({ circuit }: { circuit: Circuit }) => {
  // Request time, so the build doesn't fetch every circuit's history (the
  // API allows 4 requests a second)
  await io();
  const { circuitId, circuitName, Location } = circuit;
  const { races, fastestLaps } = await getCircuitHistory(circuitId);
  // The map comes from the latest race OpenF1 covers
  const mapRace = races.findLast(
    (race) => Number(race.season) >= OPENF1_FIRST_SEASON,
  );
  const tags = getCircuitTags(circuitId);

  return (
    <>
      <PageHeader
        back="/calendar"
        meta={[
          "CIRCUIT",
          Location.country.toUpperCase(),
          races[0] && `SINCE ${races[0].season}`,
        ]
          .filter(Boolean)
          .join(" · ")}
        title={circuitName}
      >
        {tags.length > 0 && (
          <ul aria-label="About the circuit" className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-surface-raised px-3 py-1.5 text-[13px] font-semibold"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </PageHeader>
      {/* Two columns while there's a map (or its skeleton) to sit beside */}
      <div className="grid items-start gap-6 lg:gap-10 lg:has-[[data-track-map]]:grid-cols-[minmax(0,1fr)_330px]">
        {mapRace && (
          <Slot fallback={<TrackMapSkeleton />}>
            <TrackMapCard race={mapRace} circuitName={circuitName} />
          </Slot>
        )}
        <aside
          aria-label="Facts and winners"
          className="@container flex min-w-0 flex-col gap-6 lg:bg-surface lg:p-6"
        >
          <CircuitFacts circuitId={circuitId} races={races} />
          {/* One column in the side panel, three when it runs full width */}
          <div className="grid items-start gap-6 @3xl:grid-cols-3">
            <LapRecord fastestLaps={fastestLaps} />
            <Slot label="Recent winners" fallback={<RecentWinnersSkeleton />}>
              <RecentWinners races={races} />
            </Slot>
            <MostWins races={races} />
            {!races.length && (
              <p className="text-muted">
                No Grand Prix has been held here yet.
              </p>
            )}
            <Slot fallback={null}>
              <SeasonWeekendLink circuitId={circuitId} />
            </Slot>
          </div>
          <InlineLink
            href={circuit.url.replace(/^http:/, "https:")}
            className="self-start"
          >
            Circuit on Wikipedia
          </InlineLink>
        </aside>
      </div>
    </>
  );
};
