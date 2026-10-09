import Link from "next/link";
import { Card, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getSeasonSchedule } from "@/lib/api/jolpica";
import type { RaceResults } from "@/lib/api/types";
import { raceHref } from "@/lib/domain/routes";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";

const COUNT = 6;

// The last six winners here, newest first, each linking to its race weekend
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
      <div className="flex justify-between pb-2">
        <h2 id="recent-winners">
          <Label>Recent winners</Label>
        </h2>
        <Label aria-hidden>Team</Label>
      </div>
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
                <span className="w-10 shrink-0 font-mono text-[13px] font-bold text-muted">
                  {race.season}
                  <span className="sr-only"> {race.raceName}:</span>
                </span>
                <TeamBar
                  color={getTeamColor(winner.Constructor.constructorId)}
                  height={24}
                />
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold group-hover:underline">
                  {getDriverName(winner.Driver)}
                </span>
                <span className="shrink-0 text-[13px] text-muted">
                  <span className="sr-only">, </span>
                  {winner.Constructor.name}
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
  <CardSkeleton lines={6} className="min-h-[310px]" />
);
