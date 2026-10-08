import type { Metadata } from "next";
import { StandingsHeader } from "@/components/standings/StandingsHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Constructors' standings" };

export default function ConstructorStandingsPage() {
  return (
    <>
      <StandingsHeader value="constructors" />
      <Stub
        issue={10}
        links={[
          { href: "/teams/mercedes", label: "Mercedes" },
          { href: "/teams/ferrari", label: "Ferrari" },
        ]}
      >
        The constructors&apos; championship with gaps and wins.
      </Stub>
    </>
  );
}
