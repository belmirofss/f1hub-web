import type { ComponentType } from "react";
import Link from "next/link";
import { io } from "next/cache";
import type { LucideProps } from "lucide-react";
import { ChartLine, Disc, Mic } from "lucide-react";
import { Card, InlineLink } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatRows, type Stat } from "@/components/ui/StatRows";
import {
  getLastRaceResults,
  getQualifying,
  getSeasonSchedule,
} from "@/lib/api/jolpica";
import { OPENF1_FIRST_SEASON } from "@/lib/api/openf1";
import {
  getFastestLap,
  getGridPosition,
  getTopGainer,
} from "@/lib/domain/results";
import { cn } from "@/lib/cn";
import { ordinal } from "@/lib/domain/drivers";
import { driverHref, raceHref } from "@/lib/domain/routes";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";

const Shortcut = ({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: ComponentType<LucideProps>;
}) => (
  <Link
    href={href}
    className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-surface-raised px-2 text-[13px] font-bold whitespace-nowrap transition-colors hover:bg-line"
  >
    <Icon aria-hidden size={16} strokeWidth={2} />
    {label}
  </Link>
);

// P2, P1, P3 from left to right, the winner's block the tallest. The list
// stays in finishing order for screen readers.
const PODIUM_STEPS = ["order-2 h-[74px]", "order-1 h-[52px]", "order-3 h-10"];

export const LastRaceCard = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const race = await getLastRaceResults();
  const results = race?.Results ?? [];
  const winner = results[0];
  if (!race || !winner) return null;

  const [qualifying, seasonRaces] = await Promise.all([
    getQualifying(race.season, race.round),
    getSeasonSchedule(race.season),
  ]);
  const href = raceHref(race, seasonRaces);
  const pole = qualifying?.QualifyingResults?.[0];
  const fastest = getFastestLap(results);
  const gainer = getTopGainer(results);
  const hasOpenF1 = Number(race.season) >= OPENF1_FIRST_SEASON;

  const stats: Stat[] = [];
  if (pole) {
    stats.push({
      label: "Pole",
      who: getDriverName(pole.Driver),
      value: pole.Q3 ?? pole.Q2 ?? pole.Q1,
    });
  }
  if (fastest) {
    stats.push({
      label: "Fastest lap",
      labelClassName: "text-purple",
      who: getDriverName(fastest.Driver),
      value: fastest.FastestLap?.Time.time,
    });
  }
  if (gainer && gainer.gained > 0) {
    stats.push({
      label: "Top gainer",
      labelClassName: "text-gain",
      who: getDriverName(gainer.result.Driver),
      value: `▲${gainer.gained} · P${getGridPosition(gainer.result, results.length)}→P${gainer.result.position}`,
    });
  }

  const podium = results.slice(0, 3);

  return (
    <Card as="section" aria-labelledby="last-race">
      <div className="flex items-center justify-between gap-3">
        <h2 id="last-race">
          <Label>
            Last race · R{race.round} {race.Circuit.Location.locality}
          </Label>
        </h2>
        <InlineLink href={href}>Full results</InlineLink>
      </div>

      <Link
        href={driverHref(winner.Driver.driverId)}
        className="group flex flex-col gap-1"
      >
        <span className="display-title text-[30px] leading-none group-hover:underline">
          {getDriverName(winner.Driver)}
        </span>
        <span className="text-sm text-soft">
          Won the {race.raceName}
          {winner.Time?.time && (
            <>
              {" · "}
              <span className="font-mono text-[13px]">{winner.Time.time}</span>
            </>
          )}
        </span>
      </Link>

      {podium.length === 3 && (
        <ol aria-label="Podium" className="flex h-[74px] items-end gap-1.5">
          {podium.map((result, index) => (
            <li
              key={result.Driver.driverId}
              className={cn(
                "flex flex-1 items-center justify-center border-t-[3px] bg-surface-raised text-[13px] font-bold",
                PODIUM_STEPS[index],
              )}
              style={{
                borderTopColor: getTeamColor(result.Constructor.constructorId),
              }}
            >
              <span className="sr-only">
                {ordinal(index + 1)}: {getDriverName(result.Driver)}
              </span>
              <span aria-hidden>{getDriverCode(result.Driver)}</span>
            </li>
          ))}
        </ol>
      )}

      {stats.length > 0 && <StatRows stats={stats} />}

      <nav aria-label="Race analysis" className="flex flex-wrap gap-2">
        <Shortcut
          href={`${href}/analysis`}
          label="Lap chart"
          Icon={ChartLine}
        />
        {hasOpenF1 && (
          <>
            <Shortcut
              href={`${href}/analysis#tyres`}
              label="Tyres"
              Icon={Disc}
            />
            <Shortcut href={`${href}/radio`} label="Radio" Icon={Mic} />
          </>
        )}
      </nav>
    </Card>
  );
};

export const LastRaceCardSkeleton = () => (
  <CardSkeleton
    lines={8}
    className="min-h-[395px] md:min-h-[415px] lg:min-h-[395px]"
  />
);
