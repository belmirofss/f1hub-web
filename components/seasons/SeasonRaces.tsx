// Every race of a season with its date and winner, from the app's
// src/screens/Archive/Season.tsx
import Link from "next/link";
import { io } from "next/cache";
import { ChevronRight } from "lucide-react";
import { TeamBar } from "@/components/ui/Card";
import { ListSkeleton, LoadingRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { getSeasonSchedule, getSeasonWinners } from "@/lib/api/jolpica";
import { raceHref } from "@/lib/domain/routes";
import { formatRaceDay } from "@/lib/domain/sessions";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";

export const SeasonRaces = async ({ year }: { year: string }) => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const [races, winners] = await Promise.all([
    getSeasonSchedule(year),
    getSeasonWinners(year),
  ]);
  if (!races.length) {
    return <EmptyState>No races found for this season.</EmptyState>;
  }

  const winnerByRound = new Map(
    winners.map((race) => [race.round, race.Results?.[0]]),
  );

  return (
    // A ruled list, edge to edge on phones and tablets
    <ol
      aria-label={`${year} races`}
      className="-mx-4 border-t-2 border-text md:-mx-6 lg:mx-0"
    >
      {races.map((race) => {
        const winner = winnerByRound.get(race.round);
        const { circuitName, Location } = race.Circuit;
        return (
          <li key={race.round}>
            <Link
              href={raceHref(race, races)}
              className="flex min-h-[54px] items-center gap-2.5 border-b border-line-soft px-4 transition-colors hover:bg-surface md:px-6 lg:px-2"
            >
              <span className="w-6 shrink-0 font-mono text-xs text-muted">
                <span className="sr-only">Round </span>
                {race.round.padStart(2, "0")}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-bold">
                  {race.raceName}
                </span>
                <time
                  dateTime={race.date}
                  className="font-mono text-[10px] text-muted"
                >
                  {formatRaceDay(race)}
                </time>
              </span>
              {/* Desktop has room for where the race was */}
              <span className="hidden min-w-0 flex-1 truncate text-sm text-muted lg:block">
                {circuitName} · {Location.locality}
              </span>
              {winner && (
                <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold lg:w-48">
                  <TeamBar
                    color={getTeamColor(winner.Constructor.constructorId)}
                    height={18}
                  />
                  <span className="sr-only">Winner: </span>
                  <span className="lg:hidden">{winner.Driver.familyName}</span>
                  <span className="truncate max-lg:hidden">
                    {getDriverName(winner.Driver)}
                  </span>
                </span>
              )}
              <ChevronRight
                aria-hidden
                size={14}
                strokeWidth={2}
                className="shrink-0 text-muted"
              />
            </Link>
          </li>
        );
      })}
    </ol>
  );
};

export const SeasonRacesSkeleton = () => (
  <LoadingRegion label="Loading races">
    <ListSkeleton rows={10} />
  </LoadingRegion>
);
