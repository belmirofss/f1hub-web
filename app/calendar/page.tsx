import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stub } from "@/components/Stub";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" meta="2026" />
      <Stub
        issue={9}
        links={[
          {
            href: "/races/2026/bahrain-grand-prix-in-malaysia",
            label: "Bahrain Grand Prix in Malaysia",
          },
          {
            href: "/races/2026/singapore-grand-prix/schedule",
            label: "Singapore Grand Prix",
          },
        ]}
      >
        Every round of the season, coloured by the winning team, with a jump to
        the next race.
      </Stub>
    </>
  );
}
