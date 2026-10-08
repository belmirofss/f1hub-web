import { Suspense } from "react";
import { io } from "next/cache";
import { PageHeader } from "@/components/layout/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { getDriverStandings, getSeasonSchedule } from "@/lib/api/jolpica";

type View = "drivers" | "constructors" | "teammates";

// "AFTER R16 · 7 TO GO", or nothing before the first round
const StandingsMeta = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const [standings, races] = await Promise.all([
    getDriverStandings("current"),
    getSeasonSchedule("current"),
  ]);
  const round = Number(standings?.round ?? 0);
  if (!round) return null;
  const remaining = races.length - round;
  return `AFTER R${round}${remaining > 0 ? ` · ${remaining} TO GO` : ""}`;
};

export const StandingsHeader = ({ value }: { value: View }) => (
  <PageHeader
    title="Standings"
    meta={
      <Suspense fallback={null}>
        <StandingsMeta />
      </Suspense>
    }
  >
    <Segmented<View>
      label="Standings view"
      value={value}
      className="lg:max-w-md"
      options={[
        { value: "drivers", label: "Drivers", href: "/standings" },
        {
          value: "constructors",
          label: "Constructors",
          href: "/standings/constructors",
        },
        {
          value: "teammates",
          label: "Teammates",
          href: "/standings/teammates",
        },
      ]}
    />
  </PageHeader>
);
