import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Columns } from "@/components/layout/Columns";
import { PosterPageSkeleton } from "@/components/layout/PageSkeletons";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PointsPerRound,
  PointsPerRoundSkeleton,
} from "@/components/teams/PointsPerRound";
import {
  PositionHistory,
  PositionHistorySkeleton,
} from "@/components/teams/PositionHistory";
import {
  TeamDrivers,
  TeamDriversSkeleton,
} from "@/components/teams/TeamDrivers";
import { TeamHero } from "@/components/teams/TeamHero";
import { TeamStats } from "@/components/teams/TeamStats";
import { TeammateLink } from "@/components/teams/TeammateLink";
import { Slot } from "@/components/ui/Slot";
import { StatRailSkeleton } from "@/components/ui/StatRail";
import {
  getConstructor,
  getConstructorSeasons,
  getConstructorTitles,
  getConstructorWins,
  getCurrentSeason,
} from "@/lib/api/jolpica";
import type { Constructor } from "@/lib/api/types";
import { teamHref } from "@/lib/domain/routes";
import { getTeamHero } from "@/lib/domain/teams";
import { orFallback, pageMetadata, plural } from "@/lib/metadata";
import { breadcrumbLd, teamLd } from "@/lib/structuredData";

// Constructor ids are lowercase words joined by "_" or "-" ("red_bull",
// "brabham-repco")
const findTeam = async (param: string) => {
  const constructorId = decodeURIComponent(param);
  if (!/^[a-z0-9_-]+$/.test(constructorId)) notFound();
  const team = await getConstructor(constructorId);
  if (!team) notFound();
  return team;
};

export const generateMetadata = async ({
  params,
}: PageProps<"/teams/[constructorId]">): Promise<Metadata> => {
  const team = await findTeam((await params).constructorId);
  const { constructorId, name } = team;
  const [titleSeasons, seasons, current] = await Promise.all([
    getConstructorTitles(constructorId),
    orFallback(getConstructorSeasons(constructorId)),
    orFallback(getCurrentSeason()),
  ]);
  const titles = titleSeasons.length;
  const wins =
    seasons && (await orFallback(getConstructorWins(constructorId, seasons)));

  // "202 wins in 61 seasons since 1966"
  let record = "";
  const first = seasons?.[0];
  const last = seasons?.at(-1);
  if (seasons && first && last && wins !== null) {
    const span =
      Number(last) === current
        ? `since ${first}`
        : first === last
          ? `in ${first}`
          : `from ${first} to ${last}`;
    record = `${plural(wins, "win")} in ${plural(seasons.length, "season")} ${span}`;
  }

  const facts = [
    titles ? `${titles}× constructors' champion` : "",
    record,
  ].filter(Boolean);
  return pageMetadata({
    title: `${name}: F1 team stats, drivers and history`,
    description: `${name}, ${team.nationality} Formula 1 team${
      facts.length ? `: ${facts.join(", ")}` : ""
    }. Drivers, all-time stats and championship history.`,
    path: teamHref(constructorId),
    image: `${teamHref(constructorId)}/opengraph-image`,
  });
};

// The page waits for this one cached request before it starts streaming, so
// an unknown team gets a real 404 instead of a 200 with a not-found page.
// That makes it a blocking route rather than an instant App Shell.
export const instant = false;

export default async function TeamPage({
  params,
}: PageProps<"/teams/[constructorId]">) {
  const team = await findTeam((await params).constructorId);

  return (
    <>
      <JsonLd
        data={[
          teamLd(team),
          breadcrumbLd([
            { name: team.name, path: teamHref(team.constructorId) },
          ]),
        ]}
      />
      <Suspense fallback={<PosterPageSkeleton />}>
        <TeamContent team={team} />
      </Suspense>
    </>
  );
}

// Everything that needs the team's seasons
const TeamContent = async ({ team }: { team: Constructor }) => {
  const { constructorId } = team;
  const [seasons, titles] = await Promise.all([
    getConstructorSeasons(constructorId),
    getConstructorTitles(constructorId),
  ]);
  const latest = seasons.at(-1);

  return (
    <>
      <div className="flex flex-col">
        <TeamHero team={team} seasons={seasons} titles={titles} />
        <Slot label="Stats" fallback={<StatRailSkeleton />}>
          <TeamStats
            constructorId={constructorId}
            seasons={seasons}
            titles={titles}
          />
        </Slot>
      </div>
      <Columns
        asideLabel="Championship history and teammates"
        aside={
          <>
            <Slot fallback={<PositionHistorySkeleton />}>
              <PositionHistory
                constructorId={constructorId}
                seasons={seasons}
                titles={titles}
                hero={getTeamHero(constructorId)}
              />
            </Slot>
            {latest && (
              <Slot fallback={null}>
                <TeammateLink constructorId={constructorId} season={latest} />
              </Slot>
            )}
          </>
        }
      >
        {latest && (
          <Slot label="Drivers" fallback={<TeamDriversSkeleton />}>
            <TeamDrivers constructorId={constructorId} season={latest} />
          </Slot>
        )}
        {latest && (
          <Slot fallback={<PointsPerRoundSkeleton />}>
            <PointsPerRound constructorId={constructorId} season={latest} />
          </Slot>
        )}
      </Columns>
    </>
  );
};
