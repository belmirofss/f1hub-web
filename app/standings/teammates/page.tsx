import type { Metadata } from "next";
import { StandingsHeader } from "@/components/standings/StandingsHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Teammate battles" };

export default function TeammatesPage() {
  return (
    <>
      <StandingsHeader value="teammates" />
      <Stub issue={11}>
        Qualifying, race, points and podium head-to-heads inside every team.
      </Stub>
    </>
  );
}
