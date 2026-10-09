import { Suspense } from "react";
import type { Metadata } from "next";
import { Calendar, CalendarSkeleton } from "@/components/calendar/Calendar";
import { getSeasonSchedule, getSeasonWinners } from "@/lib/api/jolpica";
import { isSprintWeekend } from "@/lib/domain/sessions";
import { orFallback, pageMetadata, plural } from "@/lib/metadata";

export const generateMetadata = async (): Promise<Metadata> => {
  const [races, winners] = await Promise.all([
    orFallback(getSeasonSchedule("current")),
    orFallback(getSeasonWinners("current")),
  ]);
  const first = races?.[0];
  const last = races?.at(-1);
  if (!races || !first || !last) {
    return pageMetadata({
      title: "F1 calendar: race dates, times and results",
      description:
        "Every round of the Formula 1 season: dates in your time zone, sprint weekends and the winner of each race.",
      path: "/calendar",
    });
  }

  // "24 rounds from the Australian Grand Prix to the Abu Dhabi Grand Prix,
  // 6 of them sprint weekends. 17 races run so far."
  const year = first.season;
  const sprints = races.filter(isSprintWeekend).length;
  const run = winners?.length ?? 0;
  const progress =
    run === races.length
      ? " Every race has been run."
      : run
        ? ` ${plural(run, "race")} run so far.`
        : "";
  return pageMetadata({
    title: `F1 calendar ${year}: race dates, times and results`,
    description: `The ${year} Formula 1 calendar: ${races.length} rounds from the ${first.raceName} to the ${last.raceName}${
      sprints ? `, ${plural(sprints, "sprint weekend")}` : ""
    }.${progress} Session times in your time zone and the winner of each race.`,
    path: "/calendar",
  });
};

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <Calendar />
    </Suspense>
  );
}
