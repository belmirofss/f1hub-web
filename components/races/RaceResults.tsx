// Ported from the app's src/screens/RaceWeekend/ResultsTab.tsx. The Race and
// Sprint tabs: summary card, then the classification. Desktop adds team,
// grid and laps columns and moves the summary beside the table.
import Link from "next/link";
import { Columns } from "@/components/layout/Columns";
import { Card, LinkCard, TeamBar } from "@/components/ui/Card";
import { StatRows, type Stat } from "@/components/ui/StatRows";
import { LAPS_FIRST_SEASON, PIT_STOPS_FIRST_SEASON } from "@/lib/api/jolpica";
import { OPENF1_FIRST_SEASON } from "@/lib/api/openf1";
import type { QualifyingResult, RaceBase, Result } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import {
  getBestQualifyingTime,
  getFastestLap,
  getGapToLeader,
  getPlacesGained,
  getStatusLabel,
  getTopGainer,
  isClassified,
} from "@/lib/domain/results";
import { driverHref } from "@/lib/domain/routes";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";

// The longest retirements list before the rest becomes "+N"
const MAX_RETIREMENTS = 4;

const getStats = (results: Result[], pole?: QualifyingResult): Stat[] => {
  const fastest = getFastestLap(results);
  const gainer = getTopGainer(results);
  const retired = results.filter((r) => !isClassified(r));
  // Without qualifying times (sprints, races before 1994) pole is the front
  // of the grid
  const poleSitter =
    pole?.Driver ?? results.find((r) => r.grid === "1")?.Driver;

  const stats: Stat[] = [];
  if (poleSitter) {
    stats.push({
      label: "Pole",
      who: getDriverName(poleSitter),
      value: pole && getBestQualifyingTime(pole),
    });
  }
  if (fastest?.FastestLap) {
    stats.push({
      label: "Fastest lap",
      labelClassName: "text-purple",
      who: getDriverName(fastest.Driver),
      value: `${fastest.FastestLap.Time.time} · L${fastest.FastestLap.lap}`,
    });
  }
  if (gainer && gainer.gained > 0) {
    stats.push({
      label: "Top gainer",
      labelClassName: "text-gain",
      who: getDriverName(gainer.result.Driver),
      value: `▲${gainer.gained}`,
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
  });
  return stats;
};

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
    <span className={up ? "text-gain" : "text-loss"}>
      <span aria-hidden>{up ? `▲${gained}` : `▼${-gained}`}</span>
      <span className="sr-only">
        {up ? `gained ${gained}` : `lost ${-gained}`}
      </span>
    </span>
  );
};

// Every column but the driver shrinks to fit, so the driver gets the rest
const header =
  "w-px whitespace-nowrap pb-1.5 text-left align-bottom font-medium lg:px-2 lg:pb-2";
const cell = "h-12 border-b border-line-soft lg:h-[46px] lg:px-2";
const desktopOnly = "max-lg:hidden";

const ResultsTable = ({
  results,
  label,
}: {
  results: Result[];
  label: string;
}) => {
  const size = results.length;
  const leader = results[0];
  const fastest = getFastestLap(results);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{label}</caption>
        <thead className="font-mono text-[11px] tracking-[1px] text-muted uppercase">
          <tr className="border-b border-line">
            <th scope="col" className={cn(header, "min-w-[38px] lg:w-12")}>
              <abbr title="Position" className="no-underline">
                Pos
              </abbr>
            </th>
            <th scope="col" className={cn(header, "min-w-[38px] lg:w-12")}>
              <abbr title="Places gained" className="no-underline">
                +/-
              </abbr>
            </th>
            <th scope="col" className={cn(header, "w-auto")}>
              Driver
            </th>
            <th scope="col" className={cn(header, desktopOnly)}>
              Team
            </th>
            <th scope="col" className={cn(header, desktopOnly, "text-right")}>
              Grid
            </th>
            <th scope="col" className={cn(header, desktopOnly, "text-right")}>
              Laps
            </th>
            <th scope="col" className={cn(header, "pl-2 text-right")}>
              Time
            </th>
            <th scope="col" className={cn(header, "pl-2 text-right")}>
              <abbr title="Points" className="no-underline">
                Pts
              </abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const classified = isClassified(result);
            const isFastest = result === fastest;
            const points = Number(result.points);
            const { Driver, Constructor } = result;

            return (
              // The driver's link stretches over the whole row
              <tr
                key={Driver.driverId}
                className="relative transition-colors hover:bg-surface"
              >
                <td className={`${cell} font-mono text-sm font-bold`}>
                  {classified ? result.position : getStatusLabel(result)}
                </td>
                <td className={`${cell} font-mono text-[11px] lg:text-xs`}>
                  {classified && (
                    <Delta gained={getPlacesGained(result, size)} />
                  )}
                </td>
                <td className={`${cell} max-w-0`}>
                  <div className="flex items-center gap-2 lg:gap-2.5">
                    <TeamBar
                      color={getTeamColor(Constructor.constructorId)}
                      className="h-[26px]! lg:h-6!"
                    />
                    <div className="flex min-w-0 flex-col">
                      <Link
                        href={driverHref(Driver.driverId)}
                        className="truncate text-sm font-bold after:absolute after:inset-0 hover:underline lg:text-[15px]"
                      >
                        <span className="font-mono">
                          {getDriverCode(Driver)}
                        </span>{" "}
                        <span className="font-normal text-muted lg:text-soft">
                          <span className="max-lg:hidden">
                            {Driver.givenName}{" "}
                          </span>
                          {Driver.familyName}
                        </span>
                      </Link>
                      <span className="truncate text-[11px] text-muted lg:hidden">
                        {Constructor.name}
                      </span>
                    </div>
                  </div>
                </td>
                <td
                  className={`${cell} ${desktopOnly} text-sm whitespace-nowrap text-muted`}
                >
                  {Constructor.name}
                </td>
                <td
                  className={`${cell} ${desktopOnly} text-right font-mono text-sm text-muted`}
                >
                  {/* Grid 0 is a pit lane start, or no start at all */}
                  {Number(result.grid) > 0
                    ? result.grid
                    : Number(result.laps) > 0
                      ? "Pit"
                      : "–"}
                </td>
                <td
                  className={`${cell} ${desktopOnly} text-right font-mono text-sm text-muted`}
                >
                  {result.laps}
                </td>
                <td
                  className={cn(
                    cell,
                    "pl-2 text-right font-mono text-xs whitespace-nowrap lg:text-[13px]",
                    !classified
                      ? "text-loss"
                      : isFastest
                        ? "text-purple"
                        : !result.Time?.time && "text-muted",
                  )}
                >
                  <span
                    title={classified ? undefined : result.status}
                    className="ml-auto block max-w-24 truncate lg:max-w-none"
                  >
                    {classified
                      ? getGapToLeader(result, leader)
                      : result.status}
                  </span>
                  {isFastest && <span className="sr-only">, fastest lap</span>}
                </td>
                <td
                  className={`${cell} pl-2 text-right font-mono text-[13px] font-bold lg:text-[15px]`}
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
  analysisHref,
}: {
  race: Pick<RaceBase, "season" | "raceName">;
  results: Result[];
  kind: "race" | "sprint";
  // Qualifying P1, for the race's pole time
  pole?: QualifyingResult;
  // Desktop links the race to its Analysis tab
  analysisHref?: string;
}) => {
  const name = kind === "race" ? "Race" : "Sprint";
  const laps = results[0]?.laps;
  const season = Number(race.season);
  // What the Analysis tab has for this race, or nothing before lap data
  const analysis =
    season >= OPENF1_FIRST_SEASON
      ? "Lap chart and tyre strategy"
      : season >= PIT_STOPS_FIRST_SEASON
        ? "Lap chart and pit stops"
        : season >= LAPS_FIRST_SEASON
          ? "Lap chart"
          : undefined;

  return (
    <Columns
      asideLabel={`${name} summary`}
      // Phones show the summary above the table, desktop beside it
      asideClassName="max-lg:order-first max-lg:basis-full"
      aside={
        <>
          <Card className="gap-0 py-1 lg:px-5 lg:py-2">
            <StatRows stats={getStats(results, pole)} />
          </Card>
          {analysisHref && analysis && (
            <LinkCard href={analysisHref} className="max-lg:hidden">
              <span className="font-bold">{analysis}</span>
              {laps && (
                <span className="font-mono text-[10px] text-muted">
                  {laps} LAPS
                </span>
              )}
            </LinkCard>
          )}
        </>
      }
    >
      <ResultsTable
        results={results}
        label={`${race.raceName} ${race.season}, ${name.toLowerCase()} classification`}
      />
    </Columns>
  );
};
