import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getSeasonSprintResults } from "@/lib/api/jolpica";
import type { Driver, Result } from "@/lib/api/types";
import { formatPoints } from "@/lib/domain/drivers";
import { getDriverCode, getTeamColor } from "@/lib/domain/teams";
import { getTeamPair } from "@/lib/team";

const CHART_HEIGHT = 110;
// The second driver's share of each bar
const FADED = 0.45;

// Race + sprint points of the team's two main drivers, round by round, as
// stacked bars: the higher-placed driver at the bottom
export const PointsPerRound = async ({
  constructorId,
  season,
}: {
  constructorId: string;
  season: string;
}) => {
  const [{ pair, results }, sprints] = await Promise.all([
    getTeamPair(season, constructorId),
    getSeasonSprintResults(season),
  ]);
  if (!pair) return null;

  // Only what they scored for this team, if one of them moved mid-season
  const forTeam = (driver: Driver) => (row: Result) =>
    row.Driver.driverId === driver.driverId &&
    row.Constructor.constructorId === constructorId;

  const sprintByRound = new Map(sprints.map((race) => [race.round, race]));
  const rounds = results.map((race) => {
    const sprint = sprintByRound.get(race.round)?.SprintResults ?? [];
    const points = (driver: Driver) =>
      [...(race.Results ?? []), ...sprint]
        .filter(forTeam(driver))
        .reduce((sum, row) => sum + Number(row.points), 0);
    return { round: race.round, a: points(pair.a), b: points(pair.b) };
  });
  const max = Math.max(...rounds.map((r) => r.a + r.b));
  if (!(max > 0)) return null;

  const color = getTeamColor(constructorId);
  const height = (points: number) => (points / max) * CHART_HEIGHT;
  const legend = [
    { driver: pair.a, opacity: 1 },
    { driver: pair.b, opacity: FADED },
  ];

  return (
    <Card as="section" aria-labelledby="points-per-round">
      <div className="flex justify-between gap-3">
        <h2 id="points-per-round">
          <Label>Points per round · {season}</Label>
        </h2>
        <Label aria-hidden>
          {getDriverCode(pair.a)} / {getDriverCode(pair.b)}
        </Label>
      </div>
      <ol className="flex items-end gap-[3px]" style={{ height: CHART_HEIGHT }}>
        {rounds.map((r) => {
          const label = `Round ${r.round}: ${pair.a.familyName} ${formatPoints(r.a)}, ${pair.b.familyName} ${formatPoints(r.b)}`;
          return (
            <li
              key={r.round}
              title={label}
              className="flex h-full min-w-0 flex-1 flex-col justify-end gap-px"
            >
              <span className="sr-only">{label}</span>
              {r.b > 0 && (
                <span
                  aria-hidden
                  className="rounded-t-[2px]"
                  style={{
                    height: height(r.b),
                    backgroundColor: color,
                    opacity: FADED,
                  }}
                />
              )}
              {r.a > 0 && (
                <span
                  aria-hidden
                  className={r.b > 0 ? undefined : "rounded-t-[2px]"}
                  style={{ height: height(r.a), backgroundColor: color }}
                />
              )}
            </li>
          );
        })}
      </ol>
      <div
        aria-hidden
        className="flex justify-between font-mono text-[10px] text-muted"
      >
        <span>R{rounds[0].round}</span>
        <span>R{rounds.at(-1)?.round}</span>
      </div>
      <ul className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted">
        {legend.map(({ driver, opacity }) => (
          <li key={driver.driverId} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[2px]"
              style={{ backgroundColor: color, opacity }}
            />
            {driver.familyName}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const PointsPerRoundSkeleton = () => (
  <CardSkeleton lines={4} className="min-h-[218px]" />
);
