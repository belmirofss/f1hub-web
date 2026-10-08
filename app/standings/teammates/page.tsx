import { Suspense } from "react";
import type { Metadata } from "next";
import { StandingsHeader } from "@/components/standings/StandingsHeader";
import { Teammates, TeammatesSkeleton } from "@/components/standings/Teammates";

export const metadata: Metadata = {
  title: "Teammate battles",
  description:
    "Formula 1 teammate head-to-heads: qualifying, race, points and podiums inside every team, with the average qualifying gap.",
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
