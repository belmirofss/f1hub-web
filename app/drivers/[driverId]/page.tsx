import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutCard, AboutCardSkeleton } from "@/components/drivers/AboutCard";
import { DriverHero } from "@/components/drivers/DriverHero";
import { StatsCard, StatsCardSkeleton } from "@/components/drivers/DriverStats";
import {
  RecentRaces,
  RecentRacesSkeleton,
} from "@/components/drivers/RecentRaces";
import {
  SeasonBars,
  SeasonBarsSkeleton,
} from "@/components/drivers/SeasonBars";
import { TeammateCard } from "@/components/drivers/TeammateCard";
import { Columns } from "@/components/layout/Columns";
import { DetailPageSkeleton } from "@/components/layout/PageSkeletons";
import { Slot } from "@/components/ui/Slot";
import { TitlesCard } from "@/components/ui/TitlesCard";
import { getDriver, getDriverCareer } from "@/lib/api/jolpica";
import type { Driver } from "@/lib/api/types";
import { getTitleSeasons } from "@/lib/domain/drivers";
import { getDriverName } from "@/lib/domain/teams";

// Driver ids are lowercase words joined by "_" ("max_verstappen")
const findDriver = async (param: string) => {
  const driverId = decodeURIComponent(param);
  if (!/^[a-z0-9_-]+$/.test(driverId)) notFound();
  const driver = await getDriver(driverId);
  if (!driver) notFound();
  return driver;
};

export const generateMetadata = async ({
  params,
}: PageProps<"/drivers/[driverId]">): Promise<Metadata> => {
  const driver = await findDriver((await params).driverId);
  const name = getDriverName(driver);
  const titles = getTitleSeasons(driver.driverId).length;
  const champion = titles
    ? `${titles > 1 ? `${titles}× ` : ""}Formula 1 world champion`
    : "Formula 1 driver";
  return {
    title: name,
    description: `${name}, ${driver.nationality} ${champion}: season and career stats, last 5 races, championship position by season and biography.`,
  };
};

// The page waits for this one cached request before it starts streaming, so
// an unknown driver gets a real 404 instead of a 200 with a not-found page.
// That makes it a blocking route rather than an instant App Shell.
export const instant = false;

export default async function DriverPage({
  params,
}: PageProps<"/drivers/[driverId]">) {
  const driver = await findDriver((await params).driverId);

  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <DriverContent driver={driver} />
    </Suspense>
  );
}

// Everything that needs the career (2–6 pages on a cold cache)
const DriverContent = async ({ driver }: { driver: Driver }) => {
  const { driverId } = driver;
  const career = await getDriverCareer(driverId);
  const latest = career.seasons.at(-1);
  const titles = getTitleSeasons(driverId);

  return (
    <>
      <DriverHero driver={driver} season={latest?.season} team={latest?.team} />
      <Columns
        asideLabel="Teammate and biography"
        aside={
          <>
            {latest && (
              <Slot fallback={null}>
                <TeammateCard driverId={driverId} season={latest.season} />
              </Slot>
            )}
            <Slot label="About" fallback={<AboutCardSkeleton />}>
              <AboutCard
                driver={driver}
                debut={career.races[0]}
                titles={titles}
              />
            </Slot>
          </>
        }
      >
        <TitlesCard titles={titles} />
        <Slot label="Stats" fallback={<StatsCardSkeleton />}>
          <StatsCard driverId={driverId} career={career} latest={latest} />
        </Slot>
        <Slot label="Last 5 races" fallback={<RecentRacesSkeleton />}>
          <RecentRaces races={career.races} />
        </Slot>
        <Slot fallback={<SeasonBarsSkeleton />}>
          <SeasonBars
            driverId={driverId}
            seasons={career.seasons.map((s) => s.season)}
          />
        </Slot>
      </Columns>
    </>
  );
};
