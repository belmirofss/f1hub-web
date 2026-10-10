// The Race and Sprint tabs as a "Broadcast" table: the classification with
// each driver's tyre stints across the race distance, then a key laps
// sidebar. Seasons without OpenF1 (before 2023) keep the team, grid and laps
// columns instead of the stints.
import type { ReactNode } from "react";
import Link from "next/link";
import { TeamBar } from "@/components/ui/Card";
import { StatRows, type Stat } from "@/components/ui/StatRows";
import type {
  QualifyingResult,
  RaceBase,
  Result,
  Stint,
} from "@/lib/api/types";
import { cn } from "@/lib/cn";
import {
  getGapToLeader,
  getPlacesGained,
  getRaceHeadlines,
  getStatusLabel,
  isClassified,
} from "@/lib/domain/results";
import { driverHref } from "@/lib/domain/routes";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";
import {
  CompoundLegend,
  getStintsTotal,
  groupStints,
  StintBar,
} from "./TyreStints";

// The longest retirements list before the rest becomes "+N"
const MAX_RETIREMENTS = 4;

// Phones show every stat above the table. On desktop the race's pole,
// fastest lap and top gainer are in the weekend header, and the retirements
// are in the key laps sidebar, so only a sprint's own stats stay.
const getStats = (
  results: Result[],
  kind: "race" | "sprint",
  pole?: QualifyingResult,
): Stat[] => {
  const headlines = getRaceHeadlines(results, pole);
  const inHeader = kind === "race" ? "lg:hidden" : undefined;
  const retired = results.filter((r) => !isClassified(r));

  const stats: Stat[] = [];
  if (headlines.pole) {
    stats.push({
      label: "Pole",
      who: getDriverName(headlines.pole.driver),
      value: headlines.pole.time,
      className: inHeader,
    });
  }
  if (headlines.fastest) {
    stats.push({
      label: "Fastest lap",
      labelClassName: "text-purple",
      who: getDriverName(headlines.fastest.driver),
      value: `${headlines.fastest.time} · L${headlines.fastest.lap}`,
      className: inHeader,
    });
  }
  if (headlines.gainer) {
    stats.push({
      label: "Top gainer",
      labelClassName: "text-accent-ink",
      who: getDriverName(headlines.gainer.result.Driver),
      value: `▲${headlines.gainer.gained}`,
      className: inHeader,
    });
  }
  const codes = retired
    .slice(0, MAX_RETIREMENTS)
    .map((r) => getDriverCode(r.Driver));
  const more = retired.length - codes.length;
  stats.push({
    label: "Retirements",
    labelClassName: "text-loss",
    who: codes.length
      ? codes.join(" · ") + (more > 0 ? ` +${more}` : "")
      : "None",
    className: "lg:hidden",
  });
  return stats;
};

// ▲3 in vermilion ink, ▼2 in blue
const Delta = ({ gained }: { gained: number }) => {
  if (gained === 0) {
    return (
      <span className="text-muted">
        <span aria-hidden>–</span>
        <span className="sr-only">no change</span>
      </span>
    );
  }
  const up = gained > 0;
  return (
    <span className={up ? "text-accent-ink" : "text-second"}>
      <span aria-hidden>{up ? `▲${gained}` : `▼${-gained}`}</span>
      <span className="sr-only">
        {up ? `gained ${gained}` : `lost ${-gained}`}
      </span>
    </span>
  );
};

// Columns shrink to fit and the driver (or, with stints, the tyres) gets the
// rest. Desktop rows are short so a full field fits on one screen.
const header =
  "w-px whitespace-nowrap pb-1.5 text-left align-bottom font-medium lg:px-1.5";
const cell = "h-14 border-b border-line-soft lg:h-[26px] lg:px-1.5";
const desktopOnly = "max-lg:hidden";
const phoneOnly = "lg:hidden";

const ResultsTable = ({
  results,
  label,
  stints,
}: {
  results: Result[];
  label: string;
  // Each car's stints, by car number. Without them there's no tyre column.
  stints?: Map<number, Stint[]>;
}) => {
  const size = results.length;
  const leader = results[0];
  const fastestId = results.find((r) => r.FastestLap?.rank === "1")?.Driver
    .driverId;
  const total = stints && getStintsTotal(stints, Number(leader?.laps) || 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{label}</caption>
        <thead className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
          <tr className="border-b border-line">
            <th scope="col" className={cn(header, "min-w-8 lg:w-9")}>
              <abbr title="Position" className="no-underline">
                Pos
              </abbr>
            </th>
            <th scope="col" className={cn(header, "w-auto")}>
              Driver
            </th>
            <th scope="col" className={cn(header, desktopOnly)}>
              <abbr
                title="Places gained from the grid"
                className="no-underline"
              >
                {stints ? "Grid" : "+/-"}
              </abbr>
            </th>
            {total ? (
              <th scope="col" className={cn(header, desktopOnly, "w-[42%]")}>
                <span className="flex justify-between gap-2">
                  <span>Tyres · L1</span>
                  <span aria-hidden>L{total}</span>
                </span>
              </th>
            ) : (
              <>
                <th scope="col" className={cn(header, desktopOnly)}>
                  Team
                </th>
                <th
                  scope="col"
                  className={cn(header, desktopOnly, "text-right")}
                >
                  Grid
                </th>
                <th
                  scope="col"
                  className={cn(header, desktopOnly, "text-right")}
                >
                  Laps
                </th>
              </>
            )}
            <th scope="col" className={cn(header, "pl-2 text-right")}>
              Gap
            </th>
            <th scope="col" className={cn(header, "pl-2 text-right")}>
              <abbr title="Points" className="no-underline">
                Pts
              </abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => {
            const classified = isClassified(result);
            const isFastest = result.Driver.driverId === fastestId;
            const points = Number(result.points);
            const own = stints?.get(Number(result.number));
            const gained = classified && getPlacesGained(result, size);
            const { Driver, Constructor } = result;

            return (
              // The driver's link stretches over the whole row
              <tr
                key={Driver.driverId}
                className="relative transition-colors hover:bg-surface"
              >
                <td
                  className={cn(
                    cell,
                    "font-mono text-sm font-bold whitespace-nowrap",
                    classified && index < 3 && "text-accent-ink",
                    !classified && "text-[11px] text-second",
                  )}
                >
                  {classified ? result.position : getStatusLabel(result)}
                </td>
                <td className={`${cell} max-w-0`}>
                  <div className="flex items-center gap-2 lg:gap-2.5">
                    <TeamBar
                      color={getTeamColor(Constructor.constructorId)}
                      className="h-8! lg:h-4!"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 lg:gap-0">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <Link
                          href={driverHref(Driver.driverId)}
                          className="truncate text-sm font-bold after:absolute after:inset-0 hover:underline"
                        >
                          <span className="max-lg:hidden">
                            {Driver.givenName}{" "}
                          </span>
                          {Driver.familyName}
                        </Link>
                        {gained !== false && (
                          <span
                            className={cn(
                              phoneOnly,
                              "shrink-0 font-mono text-[10px]",
                            )}
                          >
                            <Delta gained={gained} />
                          </span>
                        )}
                      </span>
                      {/* Phones put the stints (or the team) under the name */}
                      {own && total ? (
                        <StintBar
                          stints={own}
                          total={total}
                          className={cn(phoneOnly, "h-1.5")}
                        />
                      ) : (
                        <span
                          className={cn(
                            phoneOnly,
                            "truncate text-[11px] text-muted",
                          )}
                        >
                          {Constructor.name}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td
                  className={`${cell} ${desktopOnly} font-mono text-[11px] whitespace-nowrap`}
                >
                  {gained !== false && <Delta gained={gained} />}
                </td>
                {total ? (
                  <td className={`${cell} ${desktopOnly}`}>
                    {own && (
                      <StintBar stints={own} total={total} className="h-2.5" />
                    )}
                  </td>
                ) : (
                  <>
                    <td
                      className={`${cell} ${desktopOnly} text-[13px] whitespace-nowrap text-muted`}
                    >
                      {Constructor.name}
                    </td>
                    <td
                      className={`${cell} ${desktopOnly} text-right font-mono text-[13px] text-muted`}
                    >
                      {/* Grid 0 is a pit lane start, or no start at all */}
                      {Number(result.grid) > 0
                        ? result.grid
                        : Number(result.laps) > 0
                          ? "Pit"
                          : "–"}
                    </td>
                    <td
                      className={`${cell} ${desktopOnly} text-right font-mono text-[13px] text-muted`}
                    >
                      {result.laps}
                    </td>
                  </>
                )}
                <td
                  className={cn(
                    cell,
                    "pl-2 text-right font-mono text-xs whitespace-nowrap",
                    !classified
                      ? "text-second"
                      : isFastest
                        ? "text-purple"
                        : "text-soft",
                  )}
                >
                  <span
                    title={classified ? undefined : result.status}
                    className="ml-auto block max-w-24 truncate lg:max-w-36"
                  >
                    {classified
                      ? getGapToLeader(result, leader)
                      : result.status}
                  </span>
                  {isFastest && <span className="sr-only">, fastest lap</span>}
                </td>
                <td
                  className={`${cell} pl-2 text-right font-mono text-[13px] font-bold`}
                >
                  {points > 0 ? result.points : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const RaceResults = ({
  race,
  results,
  kind,
  pole,
  stints = [],
  aside,
}: {
  race: Pick<RaceBase, "season" | "raceName">;
  results: Result[];
  kind: "race" | "sprint";
  // Qualifying P1, for the race's pole time
  pole?: QualifyingResult;
  // OpenF1 stints for the session, empty before 2023 or when it's down
  stints?: Stint[];
  // Key laps: beside the table on desktop, under it on phones
  aside?: ReactNode;
}) => {
  const name = kind === "race" ? "Race" : "Sprint";
  const byCar = groupStints(stints);
  const stats = getStats(results, kind, pole);
  // A sprint keeps its own pole, fastest lap and gainer on desktop
  const desktopStats = stats.filter((s) => !s.className).length;

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-8">
      <section
        aria-label={`${name} classification`}
        className="flex min-w-0 flex-col gap-3"
      >
        <StatRows
          stats={stats}
          className={cn(
            desktopStats
              ? "lg:grid lg:grid-cols-3 lg:gap-x-6 lg:divide-y-0 lg:border-b lg:border-line"
              : "lg:hidden",
          )}
        />
        <ResultsTable
          results={results}
          stints={byCar.size ? byCar : undefined}
          label={`${race.raceName} ${race.season}, ${name.toLowerCase()} classification`}
        />
        {byCar.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <CompoundLegend stints={stints} />
            <p className="text-[11px] text-muted">Tyre data from OpenF1</p>
          </div>
        )}
      </section>
      {aside}
    </div>
  );
};
