import type { Metadata } from "next";
import { Columns } from "@/components/layout/Columns";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Race results" };

export default function RaceResultsPage() {
  return (
    <Columns
      aside={
        <Stub
          issue={13}
          links={[
            { href: "/circuits/sepang", label: "Sepang International Circuit" },
          ]}
        >
          Pole, fastest lap and top gainer.
        </Stub>
      }
    >
      <Stub
        issue={13}
        links={[
          { href: "/drivers/max_verstappen", label: "Max Verstappen" },
          { href: "/teams/red_bull", label: "Red Bull" },
        ]}
      >
        Race classification with places gained, gaps, status and points.
      </Stub>
    </Columns>
  );
}
