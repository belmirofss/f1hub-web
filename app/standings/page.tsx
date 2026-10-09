import { Suspense } from "react";
import type { Metadata } from "next";
import { Columns } from "@/components/layout/Columns";
import { CurrentTitleFight } from "@/components/standings/CurrentTitleFight";
import { StandingsHeader } from "@/components/standings/StandingsHeader";
import {
  StandingsTable,
  StandingsTableSkeleton,
} from "@/components/standings/StandingsTable";
import { SilentBoundary } from "@/components/ui/CardBoundary";
import { getCurrentSeason } from "@/lib/api/jolpica";
import { orFallback, pageMetadata } from "@/lib/metadata";
import { describeStandings } from "@/lib/season";

export const generateMetadata = async (): Promise<Metadata> => {
  const [season, summary] = await Promise.all([
    orFallback(getCurrentSeason()),
    describeStandings("current", "drivers"),
  ]);
  return pageMetadata({
    title: `F1 drivers' standings${season ? ` ${season}` : ""}: points and title fight`,
    description: summary
      ? `${summary}. Points, gaps, last-5 form and who can still be champion.`
      : "The Formula 1 drivers' championship: points, gaps to the leader, last-5 form and who can still be champion.",
    path: "/standings",
    image: "/standings/opengraph-image",
  });
};

export default function DriverStandingsPage() {
  return (
    <>
      <StandingsHeader value="drivers" />
      {/* Phones show the title fight above the table, desktop beside it */}
      <Columns
        asideLabel="Title fight"
        asideClassName="max-lg:order-first max-lg:basis-full"
        aside={
          <SilentBoundary>
            <Suspense fallback={null}>
              <CurrentTitleFight />
            </Suspense>
          </SilentBoundary>
        }
      >
        <Suspense fallback={<StandingsTableSkeleton />}>
          <StandingsTable season="current" type="drivers" />
        </Suspense>
      </Columns>
    </>
  );
}
