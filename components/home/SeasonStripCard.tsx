import { io } from "next/cache";
import { Card, InlineLink } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getSeasonSchedule, getSeasonWinners } from "@/lib/api/jolpica";
import type { Constructor } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getTeamColor } from "@/lib/domain/teams";

// One block per round, coloured by the winning team, with the next race in
// the accent and the rest outlined, then the wins per team
export const SeasonStripCard = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const [races, winners] = await Promise.all([
    getSeasonSchedule("current"),
    getSeasonWinners("current"),
  ]);
  if (!races.length) return null;

  const winnerByRound = new Map(
    winners.flatMap((race) => {
      const team = race.Results?.[0]?.Constructor;
      return team ? [[race.round, team] as const] : [];
    }),
  );
  const nextRound = races.find((race) => !winnerByRound.has(race.round))?.round;

  const wins = new Map<string, { team: Constructor; count: number }>();
  winnerByRound.forEach((team) => {
    const entry = wins.get(team.constructorId) ?? { team, count: 0 };
    entry.count++;
    wins.set(team.constructorId, entry);
  });
  const legend = [...wins.values()].sort((x, y) => y.count - x.count);

  return (
    <Card as="section" aria-labelledby="season-strip">
      <div className="flex items-center justify-between gap-3">
        <h2 id="season-strip">
          <Label>{races[0].season} so far</Label>
        </h2>
        <InlineLink href="/calendar">Calendar</InlineLink>
      </div>
      <ol
        aria-label={`${winnerByRound.size} of ${races.length} rounds done`}
        className="flex gap-0.5"
      >
        {races.map((race) => {
          const team = winnerByRound.get(race.round);
          const next = race.round === nextRound;
          return (
            <li
              key={race.round}
              title={`R${race.round} ${race.raceName}${team ? ` · ${team.name}` : next ? " · next" : ""}`}
              className={cn(
                "h-[30px] flex-1",
                !team && !next && "border border-line-dashed",
                next && "bg-accent",
              )}
              style={
                team
                  ? { backgroundColor: getTeamColor(team.constructorId) }
                  : undefined
              }
            >
              <span className="sr-only">
                Round {race.round}, {race.raceName}
                {team ? `: won by ${team.name}` : next ? ": next" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      {legend.length > 0 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {legend.map(({ team, count }) => (
            <li
              key={team.constructorId}
              className="flex items-center gap-[5px] font-mono text-[11px] text-muted"
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
      )}
    </Card>
  );
};

export const SeasonStripCardSkeleton = () => (
  <CardSkeleton
    lines={2}
    className="min-h-[111px] md:min-h-[132px] lg:min-h-[111px]"
  />
);
