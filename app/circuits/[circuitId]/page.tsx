import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircuitFacts } from "@/components/circuits/CircuitFacts";
import { FastestLapCard } from "@/components/circuits/FastestLapCard";
import { MostWins } from "@/components/circuits/MostWins";
import {
  RecentWinners,
  RecentWinnersSkeleton,
} from "@/components/circuits/RecentWinners";
import {
  TrackMapCard,
  TrackMapSkeleton,
} from "@/components/circuits/TrackMapCard";
import { Columns } from "@/components/layout/Columns";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentSkeleton } from "@/components/layout/PageSkeletons";
import { JsonLd } from "@/components/seo/JsonLd";
import { InlineLink } from "@/components/ui/Card";
import { Slot } from "@/components/ui/Slot";
import { EmptyState } from "@/components/ui/States";
import { getCircuit, getCircuitHistory } from "@/lib/api/jolpica";
import { OPENF1_FIRST_SEASON } from "@/lib/api/openf1";
import type { Circuit } from "@/lib/api/types";
import { getWinsByDriver } from "@/lib/domain/circuits";
import { circuitHref } from "@/lib/domain/routes";
import { getDriverName } from "@/lib/domain/teams";
import { orFallback, pageMetadata, plural } from "@/lib/metadata";
import { breadcrumbLd, circuitLd } from "@/lib/structuredData";

// Circuit ids are lowercase words joined by "_" ("marina_bay")
const findCircuit = async (param: string) => {
  const circuitId = decodeURIComponent(param);
  if (!/^[a-z0-9_-]+$/.test(circuitId)) notFound();
  const circuit = await getCircuit(circuitId);
  if (!circuit) notFound();
  return circuit;
};

export const generateMetadata = async ({
  params,
}: PageProps<"/circuits/[circuitId]">): Promise<Metadata> => {
  const { circuitId, circuitName, Location } = await findCircuit(
    (await params).circuitId,
  );
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

// The page waits for this one cached request before it starts streaming, so
// an unknown circuit gets a real 404 instead of a 200 with a not-found page.
// That makes it a blocking route rather than an instant App Shell.
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
      <PageHeader
        back="/calendar"
        meta={`CIRCUIT · ${circuit.Location.country.toUpperCase()}`}
        title={circuit.circuitName}
      />
      <Suspense fallback={<ContentSkeleton />}>
        <CircuitContent circuit={circuit} />
      </Suspense>
    </>
  );
}

// Everything that needs the races held here
const CircuitContent = async ({ circuit }: { circuit: Circuit }) => {
  const { circuitId, circuitName } = circuit;
  const { races, fastestLaps } = await getCircuitHistory(circuitId);
  // The map comes from the latest race OpenF1 covers
  const mapRace = races.findLast(
    (race) => Number(race.season) >= OPENF1_FIRST_SEASON,
  );

  return (
    <Columns
      asideLabel="Winners"
      aside={
        <>
          <Slot label="Recent winners" fallback={<RecentWinnersSkeleton />}>
            <RecentWinners races={races} />
          </Slot>
          <MostWins races={races} />
          <InlineLink
            href={circuit.url.replace(/^http:/, "https:")}
            className="self-start"
          >
            Circuit on Wikipedia
          </InlineLink>
        </>
      }
    >
      {mapRace && (
        <Slot fallback={<TrackMapSkeleton />}>
          <TrackMapCard race={mapRace} circuitName={circuitName} />
        </Slot>
      )}
      <CircuitFacts circuitId={circuitId} races={races} />
      <FastestLapCard fastestLaps={fastestLaps} />
      {!races.length && (
        <EmptyState>No Grand Prix has been held here yet.</EmptyState>
      )}
    </Columns>
  );
};
