import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { FormChip } from "@/components/ui/FormChips";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getSeasonSchedule, type CareerRace } from "@/lib/api/jolpica";
import { cn } from "@/lib/cn";
import { formatPoints } from "@/lib/domain/drivers";
import { raceHref } from "@/lib/domain/routes";

const COUNT = 5;

// "2026 · R16 · FROM P3 · SPRINT P4"
const details = (race: CareerRace) =>
  [
    race.season,
    `R${race.round}`,
    race.grid > 0 ? `FROM P${race.grid}` : "PIT LANE START",
    race.sprintPosition && `SPRINT P${race.sprintPosition}`,
  ]
    .filter(Boolean)
    .join(" · ");

// The last five starts, newest first, each linking to its race weekend. For
// a former driver they're the final ones.
export const RecentRaces = async ({
  races,
  final,
}: {
  races: CareerRace[];
  final?: boolean;
}) => {
  const recent = races.slice(-COUNT).reverse();
  if (!recent.length) return null;

  // Race URLs need the whole season to spot two races with the same name
  const seasons = [...new Set(recent.map((race) => race.season))];
  const schedules = new Map(
    await Promise.all(
      seasons.map(
        async (season) => [season, await getSeasonSchedule(season)] as const,
      ),
    ),
  );

  return (
    <Card as="section" aria-labelledby="recent-races" className="gap-0 pb-1">
      <h2 id="recent-races" className="pb-2">
        <Label>
          {final ? "Final" : "Last"} {recent.length} races
        </Label>
      </h2>
      <ol>
        {recent.map((race) => {
          const points = race.points + race.sprintPoints;
          return (
            <li
              key={`${race.season}-${race.round}`}
              className="border-t border-line-soft"
            >
              <Link
                href={raceHref(race, schedules.get(race.season) ?? [])}
                className="group flex min-h-12 items-center gap-2.5 py-1"
              >
                <span aria-hidden>
                  <FormChip position={race.position} size={26} />
                </span>
                <span className="sr-only">
                  {race.position ? `P${race.position}` : "Not classified"},
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-bold group-hover:underline">
                    {race.raceName}
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    {details(race)}
                  </span>
                </span>
                <span
                  className={cn(
                    "font-mono text-[13px] font-bold",
                    points > 0 ? "text-text" : "text-muted",
                  )}
                >
                  {points > 0 ? `+${formatPoints(points)}` : "0"}
                  <span className="sr-only"> points</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

export const RecentRacesSkeleton = () => (
  <CardSkeleton lines={5} className="min-h-[290px]" />
);
