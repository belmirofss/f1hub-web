import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSeasonSchedule } from "@/lib/api/jolpica";
import { raceHref } from "@/lib/domain/routes";
import { getRequestTime } from "@/lib/requestTime";

// Vermilion button to this season's weekend at the circuit. A season that
// races here twice (Austria and Styria in 2020) points at the next one, or
// the last once both are done. Nothing when the circuit isn't on the
// calendar.
export const SeasonWeekendLink = async ({
  circuitId,
}: {
  circuitId: string;
}) => {
  const [races, now] = await Promise.all([
    getSeasonSchedule("current"),
    getRequestTime(),
  ]);
  const here = races.filter((race) => race.Circuit.circuitId === circuitId);
  const race =
    here.find((race) => Date.parse(`${race.date}T23:59:59Z`) >= now) ??
    here.at(-1);
  if (!race) return null;

  return (
    <Link
      href={raceHref(race, races)}
      className="flex min-h-12 items-center justify-center gap-2 bg-accent px-4 text-sm font-bold text-on-accent transition-[filter] hover:brightness-110"
    >
      {race.season} weekend · Round {race.round}
      <ArrowRight aria-hidden size={16} strokeWidth={2.5} />
    </Link>
  );
};
