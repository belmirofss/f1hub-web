import Link from "next/link";
import { ArrowDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LocalTime } from "@/components/time/LocalTime";
import { EmptyState } from "@/components/ui/States";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import {
  getCurrentSeason,
  getSeasonSchedule,
  getSeasonWinners,
} from "@/lib/api/jolpica";
import type { Constructor, Race, RaceResults, Result } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { textOn } from "@/lib/color";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import { raceHref } from "@/lib/domain/routes";
import {
  getRaceStart,
  getWeekendStart,
  isSprintWeekend,
} from "@/lib/domain/sessions";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";
import { HOUR } from "@/lib/domain/time";
import { getRequestTime } from "@/lib/requestTime";
import { JumpLink } from "./JumpLink";

type Row = {
  race: Race;
  winner?: Result;
  isNext: boolean;
  isPast: boolean;
};

const rowId = (race: Race) => `r${race.round}`;

// Winners colour the strip and the chips. If that request fails the calendar
// still shows, just without them.
const loadWinners = async (): Promise<RaceResults[]> => {
  try {
    return await getSeasonWinners("current");
  } catch (error) {
    console.error(error);
    return [];
  }
};

// A race is done once it has a winner or started over 3 hours ago (results
// can take a while to reach the API). The first one that isn't is next.
const getRows = (races: Race[], winners: RaceResults[], now: number): Row[] => {
  const winnerByRound = new Map(
    winners.map((race) => [race.round, race.Results?.[0]]),
  );
  let nextFound = false;
  return races.map((race) => {
    const winner = winnerByRound.get(race.round);
    const isPast = !!winner || getRaceStart(race).getTime() + 3 * HOUR < now;
    const isNext = !isPast && !nextFound;
    if (isNext) nextFound = true;
    return { race, winner, isNext, isPast };
  });
};

const getTeamWins = (rows: Row[]) => {
  const wins = new Map<string, { team: Constructor; count: number }>();
  rows.forEach(({ winner }) => {
    if (!winner) return;
    const team = winner.Constructor;
    const entry = wins.get(team.constructorId) ?? { team, count: 0 };
    entry.count++;
    wins.set(team.constructorId, entry);
  });
  return [...wins.values()].sort((x, y) => y.count - x.count);
};

// One segment per round: the winner's colour, the accent for the next race
// and an outline for the rest. Each one jumps to its row.
const SeasonStrip = ({ rows }: { rows: Row[] }) => (
  <ol
    aria-label="Season strip, coloured by winning team"
    className="flex gap-0.5"
  >
    {rows.map(({ race, winner, isNext }) => (
      <li key={race.round} className="flex flex-1">
        <JumpLink
          target={rowId(race)}
          title={`R${race.round} ${race.raceName}`}
          // Taller hit area than the 22px segment, like the app's hitSlop
          className={cn(
            "relative h-[22px] flex-1 rounded-[3px] after:absolute after:inset-x-0 after:-inset-y-2",
            !winner && !isNext && "border border-line-dashed",
            isNext && "bg-accent",
          )}
          style={
            winner
              ? {
                  backgroundColor: getTeamColor(
                    winner.Constructor.constructorId,
                  ),
                }
              : undefined
          }
        >
          <span className="sr-only">
            Round {race.round}, {race.raceName}
            {winner
              ? `: won by ${getDriverName(winner.Driver)}, ${winner.Constructor.name}`
              : isNext
                ? ": next race"
                : ""}
          </span>
        </JumpLink>
      </li>
    ))}
  </ol>
);

const TeamWins = ({ rows }: { rows: Row[] }) => {
  const wins = getTeamWins(rows);
  if (!wins.length) return null;
  return (
    <ul aria-label="Wins by team" className="flex flex-wrap gap-x-3 gap-y-1">
      {wins.map(({ team, count }) => (
        <li
          key={team.constructorId}
          className="flex items-center gap-[5px] font-mono text-[10px] text-muted"
        >
          <span
            aria-hidden
            className="size-2 rounded-[2px]"
            style={{ backgroundColor: getTeamColor(team.constructorId) }}
          />
          {team.name} {count}
          <span className="sr-only">{count === 1 ? " win" : " wins"}</span>
        </li>
      ))}
    </ul>
  );
};

const RaceRow = ({ row, races }: { row: Row; races: Race[] }) => {
  const { race, winner, isNext } = row;
  const winnerColor = getTeamColor(winner?.Constructor.constructorId);
  const { circuitName, Location } = race.Circuit;

  return (
    // Scrolls to one row below the top, so the race before it stays in view
    <li id={rowId(race)} className="scroll-mt-14">
      <Link
        href={raceHref(race, races)}
        className={cn(
          "flex h-14 items-center gap-2.5 border-b border-line-soft px-4 transition-colors hover:bg-surface md:px-6 lg:px-5",
          isNext && "bg-accent/10 hover:bg-accent/15",
        )}
      >
        <span className="w-[22px] shrink-0 font-mono text-xs text-muted">
          <span className="sr-only">Round </span>
          {race.round.padStart(2, "0")}
        </span>
        <abbr
          title={Location.country}
          className="w-8 shrink-0 font-mono text-xs font-bold no-underline"
        >
          {getCountryCode3ByName(Location.country)}
        </abbr>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold">
            {race.raceName.replace("Grand Prix", "GP")}
          </span>
          <span className="font-mono text-[10px] text-muted">
            <LocalTime
              value={getWeekendStart(race)}
              end={getRaceStart(race)}
              format="range"
            />
            {isSprintWeekend(race) && (
              <span className="whitespace-pre">{"  · SPRINT"}</span>
            )}
          </span>
        </span>
        {/* Desktop has room for where the race is */}
        <span className="hidden min-w-0 flex-1 truncate text-sm text-muted lg:block">
          {circuitName} · {Location.locality}
        </span>
        {winner ? (
          <span
            title={getDriverName(winner.Driver)}
            className="shrink-0 rounded-[4px] px-[7px] py-[3px] font-mono text-[11px] font-bold"
            style={{
              backgroundColor: winnerColor,
              color: textOn(winnerColor),
            }}
          >
            <span className="sr-only">Winner: </span>
            {getDriverCode(winner.Driver)}
          </span>
        ) : isNext ? (
          <span className="shrink-0 rounded-[4px] bg-accent px-[7px] py-[3px] font-mono text-[11px] font-bold text-on-accent">
            NEXT
          </span>
        ) : (
          <ChevronRight
            aria-hidden
            size={14}
            strokeWidth={2}
            className="shrink-0 text-muted"
          />
        )}
      </Link>
    </li>
  );
};

// Floats above the tab bar on phones and in the corner on bigger screens
const NextRaceButton = ({ race }: { race: Race }) => (
  <JumpLink
    target={rowId(race)}
    className="fixed right-[calc(16px+env(safe-area-inset-right))] bottom-[calc(80px+max(12px,env(safe-area-inset-bottom)))] z-10 flex min-h-11 items-center gap-2 rounded-[22px] bg-accent px-4 text-sm font-bold text-on-accent shadow-[0_6px_18px_rgba(26,24,20,0.2)] transition-[filter] hover:brightness-110 md:right-[calc(24px+env(safe-area-inset-right))] md:bottom-6"
  >
    <ArrowDown aria-hidden size={16} strokeWidth={2} />
    Next: {race.Circuit.Location.locality}
    <span className="sr-only">, jump to the {race.raceName}</span>
  </JumpLink>
);

export const Calendar = async () => {
  const now = await getRequestTime();
  const [season, races, winners] = await Promise.all([
    getCurrentSeason(),
    getSeasonSchedule("current"),
    loadWinners(),
  ]);

  if (!races.length) {
    return (
      <>
        <PageHeader title="Calendar" meta={season} />
        <EmptyState>
          The calendar for this season isn&apos;t out yet.
        </EmptyState>
      </>
    );
  }

  const rows = getRows(races, winners, now);
  const done = rows.filter((row) => row.isPast).length;
  const next = rows.find((row) => row.isNext)?.race;

  return (
    <>
      <PageHeader
        title="Calendar"
        meta={`${races[0].season} · ${done}/${races.length}`}
      >
        <div className="flex flex-col gap-2.5">
          <SeasonStrip rows={rows} />
          <TeamWins rows={rows} />
        </div>
      </PageHeader>
      {/* Edge to edge on phones and tablets, a card on desktop */}
      <ol
        aria-label={`${races[0].season} races`}
        className="-mx-4 border-t border-line md:-mx-6 lg:mx-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-line lg:bg-surface lg:[&>li:last-child>a]:border-b-0"
      >
        {rows.map((row) => (
          <RaceRow key={row.race.round} row={row} races={races} />
        ))}
      </ol>
      {next && <NextRaceButton race={next} />}
    </>
  );
};

export const CalendarSkeleton = () => (
  <LoadingRegion className="flex flex-col gap-3.5 lg:gap-5">
    <div className="flex flex-col gap-3 pt-[18px] lg:pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40 lg:h-11 lg:w-72" />
        <Skeleton className="h-3 w-20 lg:hidden" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-[22px] w-full" />
        <Skeleton className="h-2.5 w-3/5" />
      </div>
    </div>
    <div className="-mx-4 border-t border-line md:-mx-6 lg:mx-0 lg:rounded-lg lg:border">
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="flex h-14 items-center gap-2.5 border-b border-line-soft px-4 md:px-6 lg:px-5"
        >
          <Skeleton className="h-3 w-[22px]" />
          <Skeleton className="h-3 w-8" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </div>
  </LoadingRegion>
);
