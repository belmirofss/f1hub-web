// Ported from the app's src/screens/Standings/TitleFightCard.tsx. Home (and
// the constructors' table on desktop) shows the compact card; the drivers'
// standings show the full one with what each driver needs and, before the
// finale, the what-if simulator.
import Link from "next/link";
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
import { driverHref } from "@/lib/domain/routes";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";
import { WhatIf } from "./WhatIf";

export type TitleFight = {
  contenders: Contender[];
  left: PointsLeft;
  // The round after the standings: the finale when the what-if shows
  nextRace?: Race;
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
  const nextRace = races.find((race) => Number(race.round) > round);
  return { contenders, left, nextRace };
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
export const TitleFightCompact = ({
  fight,
  link,
}: {
  fight: TitleFight;
  // Where the header link goes; Home's default points at the full card
  link?: { href: string; label: string };
}) => {
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
          <Label className="text-accent-ink">
            Title fight · {left.points} pts left
          </Label>
        </h2>
        <InlineLink href={link?.href ?? "/standings"}>
          {link?.label ?? (isFinale(left) ? "What if" : "Standings")}
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

const NUMBER_WORDS = [
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

// "Three drivers can still be champion", digits past ten
const headline = (count: number) =>
  `${NUMBER_WORDS[count - 2] ?? count} drivers can still be champion`;

const Legend = () => (
  <ul className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-muted">
    <li className="flex items-center gap-1.5">
      <span aria-hidden className="h-2 w-3 rounded-[2px] bg-muted" />
      Points now
    </li>
    <li className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="h-2 w-3 rounded-[2px] border border-dashed border-line-dashed"
      />
      Still possible
    </li>
    <li className="flex items-center gap-1.5">
      <span aria-hidden className="h-2.5 w-0.5 bg-text" />
      Leader now
    </li>
  </ul>
);

// The Standings version: a headline, each contender's reach bar and what they
// need, and the what-if simulator before the final round. Lists the top five
// like Home and counts the rest; the what-if takes everyone still in it.
export const TitleFightFull = ({ fight }: { fight: TitleFight }) => {
  const { left, nextRace } = fight;
  const contenders = fight.contenders.slice(0, MAX_CONTENDERS);
  const others = fight.contenders.length - contenders.length;
  const leaderPoints = contenders[0].points;
  const scaleMax = leaderPoints + left.points;

  return (
    <Card
      as="section"
      aria-labelledby="title-fight"
      className="gap-3.5 border-line-dashed"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Label className="text-accent-ink">Title fight</Label>
        <Label>
          {left.races} {left.races === 1 ? "round" : "rounds"} left ·{" "}
          {left.points} pts
        </Label>
      </div>
      <h2 id="title-fight" className="text-xl leading-6 font-bold">
        {headline(fight.contenders.length)}
      </h2>
      <ul className="flex flex-col gap-3.5">
        {contenders.map((contender, index) => {
          const name = getDriverName(contender.standing.Driver);
          return (
            <li key={contender.code} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <TeamBar color={contenderColor(contender)} height={14} />
                <Link
                  href={driverHref(contender.standing.Driver.driverId)}
                  className="min-w-0 flex-1 truncate text-[15px] font-bold hover:underline"
                >
                  {name}
                </Link>
                <span className="font-mono text-[11px] text-muted">
                  {index ? `-${points(contender.gap)}` : "LEADER"}
                  {!!index && <span className="sr-only"> points</span>}
                </span>
                <span className="w-10 text-right font-mono text-[15px] font-bold">
                  {points(contender.points)}
                  <span className="sr-only"> points</span>
                </span>
              </div>
              {/* A block, so the bar's flex-1 doesn't apply down the column */}
              <div>
                <ReachBar
                  contender={contender}
                  scaleMax={scaleMax}
                  leaderPoints={leaderPoints}
                />
              </div>
              <p className="text-[13px] text-soft">{contender.needs}</p>
            </li>
          );
        })}
      </ul>
      {others > 0 && (
        <p className="text-[11px] text-muted">
          +{others} more {others === 1 ? "driver" : "drivers"} can still win
        </p>
      )}
      <Legend />
      {isFinale(left) && (
        <>
          <hr className="border-line-soft" />
          <WhatIf
            key={fight.contenders.map((c) => c.code).join()}
            contenders={fight.contenders}
            raceName={nextRace?.raceName}
          />
        </>
      )}
    </Card>
  );
};
