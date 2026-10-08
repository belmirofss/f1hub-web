// Ported from the app's src/screens/Standings/TitleFightCard.tsx. Home shows
// the compact card; the Standings page (#10) adds the full one with what each
// driver needs and the what-if simulator.
import { Card, InlineLink, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import type { DriverStanding, Race } from "@/lib/api/types";
import {
  MAX_CONTENDERS,
  getContenders,
  getPointsLeft,
  isFinale,
  type Contender,
  type PointsLeft,
} from "@/lib/domain/championship";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";

export type TitleFight = {
  contenders: Contender[];
  left: PointsLeft;
};

// Who can still be champion, or nothing once the title is decided
export const getTitleFight = (
  standings: DriverStanding[],
  round: number,
  races: Race[],
): TitleFight | undefined => {
  const left = getPointsLeft(races, round);
  const contenders = getContenders(standings, left);
  if (contenders.length < 2) return;
  return { contenders, left };
};

export const contenderColor = (contender: Contender) =>
  getTeamColor(contender.standing.Constructors.at(-1)?.constructorId);

const points = (value: number) => +value.toFixed(1);

// Points now (solid) and what's still reachable (dashed), against the
// leader's mark
export const ReachBar = ({
  contender,
  scaleMax,
  leaderPoints,
}: {
  contender: Contender;
  scaleMax: number;
  leaderPoints: number;
}) => (
  <span
    aria-hidden
    className="relative block h-2.5 min-w-0 flex-1 rounded-[3px] bg-surface-raised"
  >
    <span className="absolute inset-0 rounded-[3px] border border-dashed border-line-dashed" />
    <span
      className="absolute inset-y-0 left-0 rounded-[3px]"
      style={{
        width: `${(contender.points / scaleMax) * 100}%`,
        backgroundColor: contenderColor(contender),
      }}
    />
    <span
      className="absolute -inset-y-[3px] w-0.5 bg-text"
      style={{ left: `${(leaderPoints / scaleMax) * 100}%` }}
    />
  </span>
);

// Home's version: one line per contender with their reach bar, the top five
// only, with a count of the others still in it
export const TitleFightCompact = ({ fight }: { fight: TitleFight }) => {
  const { left } = fight;
  const contenders = fight.contenders.slice(0, MAX_CONTENDERS);
  const others = fight.contenders.length - contenders.length;
  const leaderPoints = contenders[0].points;
  const scaleMax = leaderPoints + left.points;

  return (
    <Card
      as="section"
      aria-labelledby="title-fight"
      className="border-line-dashed"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="title-fight">
          <Label className="text-accent">
            Title fight · {left.points} pts left
          </Label>
        </h2>
        <InlineLink href="/standings">
          {isFinale(left) ? "What if" : "Standings"}
        </InlineLink>
      </div>
      <ul className="flex flex-col gap-2">
        {contenders.map((contender, index) => (
          <li key={contender.code} className="flex items-center gap-2">
            <span className="sr-only">
              {getDriverName(contender.standing.Driver)},{" "}
              {points(contender.points)} points
              {index ? `, ${points(contender.gap)} behind` : ", leader"}
            </span>
            <TeamBar color={contenderColor(contender)} height={16} />
            <span aria-hidden className="w-[34px] font-mono text-xs font-bold">
              {contender.code}
            </span>
            <ReachBar
              contender={contender}
              scaleMax={scaleMax}
              leaderPoints={leaderPoints}
            />
            <span
              aria-hidden
              className="w-[34px] text-right font-mono text-[11px] text-muted"
            >
              {index ? `-${points(contender.gap)}` : "LDR"}
            </span>
            <span
              aria-hidden
              className="w-[34px] text-right font-mono text-[13px] font-bold"
            >
              {points(contender.points)}
            </span>
          </li>
        ))}
      </ul>
      {others > 0 && (
        <p className="text-[11px] text-muted">
          +{others} more {others === 1 ? "driver" : "drivers"} can still win
        </p>
      )}
    </Card>
  );
};
