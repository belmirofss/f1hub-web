import { Suspense } from "react";
import type { Metadata } from "next";
import { Columns } from "@/components/layout/Columns";
import { CurrentTitleFight } from "@/components/standings/CurrentTitleFight";
import { StandingsHeader } from "@/components/standings/StandingsHeader";
import {
  StandingsTable,
  StandingsTableSkeleton,
} from "@/components/standings/StandingsTable";
import { LinkCard } from "@/components/ui/Card";
import { SilentBoundary } from "@/components/ui/CardBoundary";
import { Label } from "@/components/ui/Label";
import { getCurrentSeason } from "@/lib/api/jolpica";
import { orFallback, pageMetadata } from "@/lib/metadata";
import { describeStandings } from "@/lib/season";

export const generateMetadata = async (): Promise<Metadata> => {
  const [season, summary] = await Promise.all([
    orFallback(getCurrentSeason()),
    describeStandings("current", "constructors"),
  ]);
  return pageMetadata({
    title: `F1 constructors' standings${season ? ` ${season}` : ""}: points and wins`,
    description: summary
      ? `${summary}. Points, wins, gaps and last-5 form.`
      : "The Formula 1 constructors' championship: points, wins, gaps to the leader and each team's form over the last five races.",
    path: "/standings/constructors",
  });
};

export default function ConstructorStandingsPage() {
  return (
    <>
      <StandingsHeader value="constructors" />
      {/* Desktop has room for the title fight and teammates beside the table */}
      <Columns
        asideClassName="max-lg:hidden"
        aside={
          <>
            <SilentBoundary>
              <Suspense fallback={null}>
                <CurrentTitleFight
                  compact
                  link={{ href: "/standings", label: "Drivers" }}
                />
              </Suspense>
            </SilentBoundary>
            <LinkCard href="/standings/teammates">
              <Label>Teammate battles</Label>
              <span className="font-bold">
                Who beats whom inside every team
              </span>
            </LinkCard>
          </>
        }
      >
        <Suspense fallback={<StandingsTableSkeleton />}>
          <StandingsTable season="current" type="constructors" />
        </Suspense>
      </Columns>
    </>
  );
}
