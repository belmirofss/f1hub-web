// Ported from the app's src/screens/RaceWeekend/AnalysisTab.tsx. The Analysis
// tab: lap chart, tyre strategy (OpenF1, 2023+) and the fastest pit stops
// (2011+). Desktop moves the pit stops beside the charts.
import { Suspense } from "react";
import Link from "next/link";
import { Columns } from "@/components/layout/Columns";
import { Card, TeamBar } from "@/components/ui/Card";
import { CardBoundary } from "@/components/ui/CardBoundary";
import { HashTarget } from "@/components/ui/HashTarget";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getLapPositions } from "@/lib/api/jolpica";
import { getRaceSession, getStints } from "@/lib/api/openf1";
import type { PitStop, Race, Result, Stint } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import {
  getGridPosition,
  getStatusLabel,
  isClassified,
  lapTimeToMs,
} from "@/lib/domain/results";
import { driverHref } from "@/lib/domain/routes";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";
import { LapChart, type LapChartDriver } from "./LapChart";

// Lap chart

// Drivers in the lap chart
const SHOWN = 10;

// The second driver of a team gets a dashed line so teammates can be told apart
const getDashed = (results: Result[]) => {
  const seen = new Set<string>();
  const dashed = new Set<string>();
  results.forEach(({ Driver, Constructor }) => {
    if (seen.has(Constructor.constructorId)) dashed.add(Driver.driverId);
    seen.add(Constructor.constructorId);
  });
  return dashed;
};

// A race is hundreds of lap rows, so only the top ten's positions reach the
// client
const LapChartCard = async ({
  race,
  results,
}: {
  race: Race;
  results: Result[];
}) => {
  const { positions, laps } = await getLapPositions(race.season, race.round);
  if (!laps) {
    return (
      <Card as="section" aria-label="Lap chart" className="lg:p-5">
        <Label>Lap chart</Label>
        <p className="text-sm text-muted">
          Lap-by-lap positions aren&apos;t out yet.
        </p>
      </Card>
    );
  }

  const field = results.length;
  const dashed = getDashed(results);
  const drivers: LapChartDriver[] = results.slice(0, SHOWN).map((result) => {
    const { Driver, Constructor } = result;
    return {
      id: Driver.driverId,
      code: getDriverCode(Driver),
      name: getDriverName(Driver),
      color: getTeamColor(Constructor.constructorId),
      dashed: dashed.has(Driver.driverId),
      grid: getGridPosition(result, field),
      // A lap missing from the data would be a hole, which JSON can't hold
      positions: Array.from(positions[Driver.driverId] ?? [], (p) => p ?? null),
    };
  });

  return <LapChart drivers={drivers} laps={laps} field={field} />;
};

// Tyre strategy

type Compound = { name: string; letter: string; className: string };

const COMPOUNDS: Record<string, Compound> = {
  SOFT: {
    name: "Soft",
    letter: "S",
    className: "bg-[#D2232D] text-white",
  },
  MEDIUM: {
    name: "Medium",
    letter: "M",
    className: "bg-sprint text-text",
  },
  HARD: {
    name: "Hard",
    letter: "H",
    className: "bg-white text-text ring-1 ring-line-dashed ring-inset",
  },
  INTERMEDIATE: {
    name: "Inter",
    letter: "I",
    className: "bg-gain text-white",
  },
  WET: { name: "Wet", letter: "W", className: "bg-[#1F5FC8] text-white" },
};
const UNKNOWN_COMPOUND: Compound = {
  name: "Unknown",
  letter: "?",
  className: "bg-line-dashed text-text",
};

const getCompound = (stint: Stint) =>
  COMPOUNDS[stint.compound] ?? UNKNOWN_COMPOUND;

const stintLaps = (stint: Stint) => stint.lap_end - stint.lap_start + 1;

const TyreStrategy = async ({
  race,
  results,
}: {
  race: Race;
  results: Result[];
}) => {
  const session = await getRaceSession(race.season, race.date);
  if (!session) return null;
  const stints = (await getStints(session)).filter(
    (s) => s.lap_end != null && s.lap_end >= s.lap_start,
  );
  if (!stints.length) return null;

  const total = Math.max(
    Number(results[0]?.laps) || 0,
    ...stints.map((s) => s.lap_end),
  );
  const used = new Set(stints.map((s) => s.compound));
  // OpenF1 knows drivers by car number, which the results carry too
  const rows = results
    .map((result) => ({
      result,
      stints: stints
        .filter((s) => s.driver_number === Number(result.number))
        .sort((a, b) => a.stint_number - b.stint_number),
    }))
    .filter((row) => row.stints.length);
  if (!rows.length) return null;

  return (
    <Card
      as="section"
      id="tyres"
      aria-labelledby="tyres-title"
      className="scroll-mt-4 lg:p-5"
    >
      {/* The Home page's last race card links here */}
      <HashTarget id="tyres" />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Label id="tyres-title">Tyre strategy</Label>
        <ul
          aria-label="Compounds"
          className="flex flex-wrap gap-2.5 text-[11px] text-muted"
        >
          {Object.entries(COMPOUNDS)
            .filter(([key]) => used.has(key))
            .map(([key, compound]) => (
              <li key={key} className="flex items-center gap-1">
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", compound.className)}
                />
                {compound.name}
              </li>
            ))}
        </ul>
      </div>

      <ol className="flex flex-col gap-1.5">
        {rows.map(({ result, stints: own }) => {
          const lastLap = own[own.length - 1].lap_end;
          const plan = own
            .map((s) => {
              const laps = stintLaps(s);
              return `${getCompound(s).name} for ${laps} ${laps === 1 ? "lap" : "laps"}`;
            })
            .join(", ");

          return (
            <li
              key={result.Driver.driverId}
              className="flex items-center gap-2"
            >
              <span
                aria-hidden
                className="w-[18px] shrink-0 text-right font-mono text-[11px] whitespace-nowrap text-muted"
              >
                {isClassified(result)
                  ? result.position
                  : getStatusLabel(result)}
              </span>
              <span
                aria-hidden
                className="w-8 shrink-0 font-mono text-xs font-bold"
              >
                {getDriverCode(result.Driver)}
              </span>
              <span className="sr-only">
                {getDriverName(result.Driver)}: {plan}
              </span>
              <span
                aria-hidden
                className="flex h-[22px] min-w-0 flex-1 gap-0.5"
              >
                {own.map((stint) => {
                  const compound = getCompound(stint);
                  const laps = stintLaps(stint);
                  return (
                    <span
                      key={stint.stint_number}
                      className={cn(
                        "flex min-w-0 basis-0 items-center overflow-hidden rounded-[4px] pl-[5px] font-mono text-[10px] font-bold whitespace-nowrap",
                        compound.className,
                      )}
                      style={{ flexGrow: laps }}
                    >
                      {laps >= 6
                        ? `${compound.letter} ${laps}`
                        : compound.letter}
                    </span>
                  );
                })}
                {lastLap < total && (
                  <span
                    className="basis-0"
                    style={{ flexGrow: total - lastLap }}
                  />
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <div
        aria-hidden
        className="flex justify-between pl-[58px] font-mono text-[10px] text-faint"
      >
        <span>L1</span>
        <span>L{Math.round(total / 2)}</span>
        <span>L{total}</span>
      </div>
    </Card>
  );
};

// Fastest pit stops

const FASTEST_STOPS = 5;

const getFastestStops = (stops: PitStop[]) =>
  stops
    .map((stop) => ({ stop, ms: lapTimeToMs(stop.duration) ?? Infinity }))
    .sort((a, b) => a.ms - b.ms)
    .slice(0, FASTEST_STOPS)
    .map(({ stop }) => stop);

// "27.295s", or "1:02.345" for a long stop
const formatDuration = (duration: string) =>
  duration.includes(":") ? duration : `${duration}s`;

const PitStops = ({
  stops,
  results,
}: {
  stops: PitStop[];
  results: Result[];
}) => {
  const byDriver = new Map(results.map((r) => [r.Driver.driverId, r]));

  return (
    <Card
      as="section"
      aria-labelledby="pit-stops-title"
      className="gap-0 pb-1 lg:px-5 lg:pb-1.5"
    >
      <div className="flex justify-between pb-2">
        <Label id="pit-stops-title">Fastest pit stops</Label>
        <Label>
          <span className="lg:hidden">Time in pit lane</span>
          <span className="max-lg:hidden">Pit lane</span>
        </Label>
      </div>
      <ol>
        {getFastestStops(stops).map((stop, index) => {
          const result = byDriver.get(stop.driverId);
          const driver = result?.Driver;
          return (
            <li key={`${stop.driverId}-${stop.stop}`}>
              <Link
                href={driverHref(stop.driverId)}
                className="flex min-h-11 items-center gap-2.5 border-t border-line-soft transition-colors hover:bg-surface-raised lg:min-h-10"
              >
                <span className="w-[18px] shrink-0 font-mono text-xs font-bold lg:w-4">
                  {index + 1}
                </span>
                <TeamBar
                  color={getTeamColor(result?.Constructor.constructorId)}
                  className="h-6! lg:h-5!"
                />
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold lg:text-sm">
                  {driver ? (
                    <>
                      <span className="max-lg:hidden">
                        <span className="sr-only">{driver.givenName} </span>
                        {driver.familyName}
                      </span>
                      <span className="lg:hidden">{getDriverName(driver)}</span>
                    </>
                  ) : (
                    stop.driverId
                  )}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted">
                  <span className="lg:hidden">LAP </span>
                  <span className="max-lg:hidden">L</span>
                  {stop.lap}
                </span>
                <span
                  className={cn(
                    "min-w-16 shrink-0 text-right font-mono text-sm font-bold lg:text-[13px]",
                    index === 0 && "text-purple",
                  )}
                >
                  {formatDuration(stop.duration)}
                  {index === 0 && <span className="sr-only">, fastest</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

export const Analysis = ({
  race,
  results,
  pitStops,
  tyres,
}: {
  race: Race;
  results: Result[];
  pitStops: PitStop[];
  // OpenF1 has tyre data from 2023
  tyres: boolean;
}) => (
  <Columns
    asideLabel="Pit stops"
    aside={
      pitStops.length > 0 && <PitStops stops={pitStops} results={results} />
    }
  >
    <CardBoundary label="Lap chart">
      <Suspense
        fallback={<CardSkeleton lines={8} className="h-[412px] lg:h-[462px]" />}
      >
        <LapChartCard race={race} results={results} />
      </Suspense>
    </CardBoundary>
    {tyres && (
      <CardBoundary label="Tyre strategy">
        <Suspense fallback={<CardSkeleton lines={10} />}>
          <TyreStrategy race={race} results={results} />
        </Suspense>
      </CardBoundary>
    )}
  </Columns>
);
