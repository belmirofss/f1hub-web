import type { ComponentType } from "react";
import Link from "next/link";
import { io } from "next/cache";
import type { LucideProps } from "lucide-react";
import { ChartLine, Disc, Mic } from "lucide-react";
import { Card, InlineLink, TeamBar } from "@/components/ui/Card";
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
import { driverHref, raceHref } from "@/lib/domain/routes";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";

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
    className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-surface-raised px-2 text-[13px] font-bold whitespace-nowrap transition-colors hover:bg-line lg:flex-none lg:gap-2 lg:px-3.5"
  >
    <Icon aria-hidden size={16} strokeWidth={2} />
    {label}
  </Link>
);

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

  return (
    <Card
      as="section"
      aria-labelledby="last-race"
      className="lg:gap-3.5 lg:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="last-race">
          <Label>Last race · {race.Circuit.Location.locality}</Label>
        </h2>
        <InlineLink href={href}>
          <span className="lg:hidden">Results</span>
          <span className="max-lg:hidden">Full results</span>
        </InlineLink>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:gap-5">
        <Link
          href={driverHref(winner.Driver.driverId)}
          className="group flex items-center gap-3 lg:flex-[1_1_260px]"
        >
          <TeamBar
            color={getTeamColor(winner.Constructor.constructorId)}
            className="h-11! lg:h-[52px]!"
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs text-muted">{race.raceName} winner</span>
            <span className="text-xl font-bold group-hover:underline lg:text-2xl">
              {getDriverName(winner.Driver)}
            </span>
            {winner.Time?.time && (
              <span className="font-mono text-xs text-soft max-lg:hidden">
                {winner.Time.time}
              </span>
            )}
          </span>
          {winner.Time?.time && (
            <span className="font-mono text-[13px] lg:hidden">
              {winner.Time.time}
            </span>
          )}
        </Link>
        {stats.length > 0 && (
          <StatRows
            stats={stats}
            className="border-t border-line lg:min-w-0 lg:flex-[2_1_320px] lg:border-t-0"
          />
        )}
      </div>

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
  <CardSkeleton lines={5} className="min-h-[330px] lg:min-h-[260px] lg:p-5" />
);
