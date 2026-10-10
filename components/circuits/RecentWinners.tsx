import Link from "next/link";
import { Card, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getSeasonSchedule } from "@/lib/api/jolpica";
import type { RaceResults } from "@/lib/api/types";
import { raceHref } from "@/lib/domain/routes";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";

const COUNT = 5;

// The last five winners here, newest first, each linking to its race weekend
export const RecentWinners = async ({ races }: { races: RaceResults[] }) => {
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
    <Card as="section" aria-labelledby="recent-winners" className="gap-0 pb-1">
      <h2 id="recent-winners" className="pb-2">
        <Label>Recent winners</Label>
      </h2>
      <ol>
        {recent.map((race) => {
          const winner = race.Results?.[0];
          if (!winner) return null;
          return (
            <li
              key={`${race.season}-${race.round}`}
              className="border-t border-line-soft"
            >
              <Link
                href={raceHref(race, schedules.get(race.season) ?? [])}
                className="group flex min-h-11 items-center gap-2.5"
              >
                <TeamBar
                  color={getTeamColor(winner.Constructor.constructorId)}
                  height={20}
                />
                <span className="min-w-0 flex-1 truncate">
                  <span className="sr-only">{race.raceName}: </span>
                  <span className="text-[15px] font-bold group-hover:underline">
                    {getDriverName(winner.Driver)}
                  </span>
                  <span className="text-[13px] text-muted">
                    <span className="sr-only">,</span> {winner.Constructor.name}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {race.season}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

export const RecentWinnersSkeleton = () => (
  <CardSkeleton lines={5} className="min-h-[260px]" />
);
