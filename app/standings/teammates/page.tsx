import { Suspense } from "react";
import type { Metadata } from "next";
import { StandingsHeader } from "@/components/standings/StandingsHeader";
import { Teammates, TeammatesSkeleton } from "@/components/standings/Teammates";
import { getCurrentSeason } from "@/lib/api/jolpica";
import { orFallback, pageMetadata } from "@/lib/metadata";

export const generateMetadata = async (): Promise<Metadata> => {
  const season = await orFallback(getCurrentSeason());
  return pageMetadata({
    title: `F1 teammate battles${season ? ` ${season}` : ""}: head-to-head by team`,
    description: `Who is beating whom inside every Formula 1 team${season ? ` in ${season}` : ""}: qualifying, race, points and podium head-to-heads, with the average qualifying gap.`,
    // ?team= only picks the pair shown first
    path: "/standings/teammates",
  });
};

export default function TeammatesPage() {
  return (
    <>
      <StandingsHeader value="teammates" />
      <Suspense fallback={<TeammatesSkeleton />}>
        <Teammates season="current" />
      </Suspense>
    </>
  );
}
