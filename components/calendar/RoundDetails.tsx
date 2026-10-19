import { CalendarPlus } from "lucide-react";
import { InlineLink, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { LocalTime } from "@/components/time/LocalTime";
import { getCircuitHistory } from "@/lib/api/jolpica";
import type { Race } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatWeekendDates, getPlaceName } from "@/lib/domain/calendar";
import { isNightRace } from "@/lib/domain/circuits";
import { raceHref } from "@/lib/domain/routes";
import {
  getSessionEnd,
  getSessions,
  getWeekendStart,
  isSprintWeekend,
  untimedLabel,
  type RoundState,
} from "@/lib/domain/sessions";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import { DETAILS_ID } from "./Timeline";
import { CircuitOutline } from "./TrackOutline";

const DAY = 24 * 3600000;

// "ROUND 17 · THIS WEEKEND", "ROUND 12 · DONE"
const roundStatus = ({ race, isPast, isNext }: RoundState, now: number) => {
  if (isPast) return "Done";
  if (!isNext) return "To come";
  return getWeekendStart(race).getTime() - now < 4 * DAY
    ? "This weekend"
    : "Next";
};

// The selected round under the timeline: where and when with the track
// outline, its sessions in the viewer's time, the last three winners there
// and an .ics download for the weekend
export const RoundDetails = async ({
  row,
  races,
  now,
}: {
  row: RoundState;
  races: Race[];
  now: number;
}) => {
  const { race, winner, isPast } = row;
  const { circuitId, circuitName, Location } = race.Circuit;
  // Extra: the details still show without it
  const history = await orFallback(getCircuitHistory(circuitId));
  const winners = (history?.races ?? []).slice(-3).reverse();
  const sessions = getSessions(race);
  const href = raceHref(race, races);
  const facts = [
    formatWeekendDates(race),
    isSprintWeekend(race) && "Sprint",
    isNightRace(circuitId) && "Night",
  ].filter(Boolean);

  return (
    <section
      id={DETAILS_ID}
      aria-labelledby="round-name"
      className="grid scroll-mt-4 gap-6 border-t-2 border-text pt-5 lg:grid-cols-[240px_minmax(0,1fr)_240px] lg:gap-8"
    >
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs tracking-[0.14em] text-accent-ink uppercase">
          Round {race.round} · {roundStatus(row, now)}
        </p>
        <h2
          id="round-name"
          className="display-title text-[40px] lg:text-[46px]"
        >
          {getPlaceName(race, races)}
        </h2>
        <p className="text-[15px] text-soft">
          {circuitName}, {Location.locality}
          <br />
          {facts.join(" · ")}
        </p>
        <CircuitOutline
          circuitId={circuitId}
          strokeWidth={5}
          start
          className="mt-2 h-[120px] w-[200px]"
        />
        {winner && (
          <p className="flex items-center gap-2 text-sm">
            <TeamBar
              color={getTeamColor(winner.Constructor.constructorId)}
              height={20}
            />
            Won by <b>{getDriverName(winner.Driver)}</b>
          </p>
        )}
        <InlineLink href={href} className="mt-1 self-start">
          Open weekend
        </InlineLink>
      </div>

      <div className="flex flex-col">
        <h3 className="pb-2">
          <Label>Sessions · your time</Label>
        </h3>
        <ol>
          {sessions.map((session) => {
            const end = getSessionEnd(session);
            const done = end <= now;
            const live = !done && session.start.getTime() <= now;
            return (
              <li
                key={session.key}
                className={cn(
                  "grid min-h-11 grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-t border-line",
                  done && "text-muted",
                )}
              >
                <LocalTime
                  value={session.start}
                  format="day"
                  className="font-mono text-xs"
                />
                <span className="truncate text-[15px] font-bold">
                  {session.name}
                  {done && <span className="sr-only">, done</span>}
                  {live && (
                    <span className="ml-2 font-mono text-[10px] tracking-[0.12em] text-accent-ink">
                      LIVE
                    </span>
                  )}
                </span>
                <span className="text-right font-mono text-[15px] font-bold">
                  {session.hasTime ? (
                    <LocalTime value={session.start} />
                  ) : (
                    untimedLabel(isPast)
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-3">
        <h3>
          <Label>Last winners here</Label>
        </h3>
        {winners.length ? (
          <ol className="flex flex-col gap-2.5">
            {winners.map((past) => {
              const result = past.Results?.[0];
              if (!result) return null;
              return (
                <li
                  key={past.season}
                  className="grid grid-cols-[4px_minmax(0,1fr)_auto] items-center gap-2.5"
                >
                  <TeamBar
                    color={getTeamColor(result.Constructor.constructorId)}
                    height={28}
                  />
                  <span className="truncate font-bold">
                    {getDriverName(result.Driver)}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {past.season}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-muted">
            {history
              ? "A new venue: no race here yet."
              : "Couldn't load the winners."}
          </p>
        )}
        {!isPast && (
          <a
            href={`${href}/calendar.ics`}
            download
            className="mt-auto flex min-h-11 items-center justify-center gap-2 border border-text text-sm font-bold transition-colors hover:bg-surface-raised"
          >
            <CalendarPlus aria-hidden size={16} strokeWidth={2} />
            Add weekend to calendar
          </a>
        )}
      </div>
    </section>
  );
};

export const RoundDetailsSkeleton = () => (
  <div
    aria-hidden
    className="grid gap-6 border-t-2 border-line-dashed pt-5 lg:grid-cols-[240px_minmax(0,1fr)_240px] lg:gap-8"
  >
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-2 h-[120px] w-[200px]" />
    </div>
    <div className="flex flex-col gap-3">
      <Skeleton className="h-3 w-36" />
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
    <div className="flex flex-col gap-3">
      <Skeleton className="h-3 w-32" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-7 w-full" />
      ))}
    </div>
  </div>
);
