import type { Metadata } from "next";
import { Columns } from "@/components/layout/Columns";
import { StandingsHeader } from "@/components/standings/StandingsHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Drivers' standings" };

export default function DriverStandingsPage() {
  return (
    <>
      <StandingsHeader value="drivers" />
      <Columns
        aside={
          <Stub issue={10}>
            Title fight and, before the finale, the what-if simulator.
          </Stub>
        }
      >
        <Stub
          issue={10}
          links={[
            { href: "/drivers/antonelli", label: "Andrea Kimi Antonelli" },
            { href: "/drivers/max_verstappen", label: "Max Verstappen" },
          ]}
        >
          The drivers&apos; championship with gaps and last-5 form.
        </Stub>
      </Columns>
    </>
  );
}
