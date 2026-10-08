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

export const metadata: Metadata = {
  title: "Drivers' standings",
  description:
    "The Formula 1 drivers' championship: points, gaps to the leader, last-5 form and who can still be champion.",
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
