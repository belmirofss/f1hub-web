// Ported from the app's src/screens/Standings/StandingsTable.tsx. Also used
// by the Season pages (#16). Desktop adds team or driver, wins and gap columns.
import Link from "next/link";
import { io } from "next/cache";
import { FormChips, FormLegend, type Form } from "@/components/ui/FormChips";
import { TeamBar } from "@/components/ui/Card";
import { ListSkeleton, LoadingRegion } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import {
  getConstructorStandings,
  getDriverStandings,
  getRecentForm,
  type SeasonParam,
} from "@/lib/api/jolpica";
import type {
  ConstructorStanding,
  DriverStanding,
  StandingType,
} from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { driverHref, teamHref } from "@/lib/domain/routes";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";

type Row = {
  id: string;
  href: string;
  position: string;
  name: string;
  color: string;
  // Drivers: their team. Constructors: their drivers' codes.
  detail?: string;
  wins: string;
  points: number;
};

const driverRows = (standings: DriverStanding[]): Row[] =>
  standings.map((s) => {
    const team = s.Constructors.at(-1);
    return {
      id: s.Driver.driverId,
      href: driverHref(s.Driver.driverId),
      position: s.positionText === "-" ? "–" : s.position,
      name: getDriverName(s.Driver),
      color: getTeamColor(team?.constructorId),
      detail: team?.name,
      wins: s.wins,
      points: Number(s.points),
    };
  });

const constructorRows = (
  standings: ConstructorStanding[],
  drivers: DriverStanding[],
): Row[] => {
  // Each driver under the team they drove for last, in championship order
  const codes = new Map<string, string[]>();
  drivers.forEach((s) => {
    const teamId = s.Constructors.at(-1)?.constructorId;
    if (!teamId) return;
    codes.set(teamId, [...(codes.get(teamId) ?? []), getDriverCode(s.Driver)]);
  });

  return standings.map((s) => ({
    id: s.Constructor.constructorId,
    href: teamHref(s.Constructor.constructorId),
    position: s.positionText === "-" ? "–" : s.position,
    name: s.Constructor.name,
    color: getTeamColor(s.Constructor.constructorId),
    detail: codes.get(s.Constructor.constructorId)?.join(" · "),
    wins: s.wins,
    points: Number(s.points),
  }));
};

const loadRows = async (season: SeasonParam, type: StandingType) => {
  const drivers = await getDriverStandings(season);
  if (type === "drivers") {
    return drivers && { ...drivers, rows: driverRows(drivers.standings) };
  }
  const constructors = await getConstructorStandings(season);
  return (
    constructors && {
      ...constructors,
      rows: constructorRows(constructors.standings, drivers?.standings ?? []),
    }
  );
};

// Every column but the name shrinks to fit, so the name gets the rest
const header =
  "w-px whitespace-nowrap pb-1.5 text-left align-bottom lg:px-2 lg:pb-2";
const cell = "h-[54px] border-b border-line-soft lg:px-2";
const desktopOnly = "max-lg:hidden";

export const StandingsTable = async ({
  season,
  type,
}: {
  season: SeasonParam;
  type: StandingType;
}) => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const list = await loadRows(season, type);
  if (!list?.rows.length) {
    return <EmptyState>The season hasn&apos;t started yet.</EmptyState>;
  }

  // Waits for the form squares too, so the rows don't shift when they arrive
  const form = await getRecentForm(list.season, Number(list.round));
  const forms: Record<string, Form> =
    type === "drivers" ? form.drivers : form.teams;

  const drivers = type === "drivers";
  const leader = list.rows[0].points;

  return (
    <section
      aria-labelledby={`${type}-table`}
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-sans">
          <caption id={`${type}-table`} className="sr-only">
            {drivers ? "Drivers'" : "Constructors'"} championship, {list.season}{" "}
            after round {list.round}
          </caption>
          <thead className="font-mono text-[11px] font-medium tracking-[1px] text-muted uppercase">
            <tr className="border-b border-line">
              <th scope="col" className={cn(header, "w-8 lg:w-10")}>
                <abbr title="Position" className="no-underline">
                  P
                </abbr>
              </th>
              <th scope="col" className={cn(header, "w-auto")}>
                {drivers ? "Driver" : "Team"}
              </th>
              <th scope="col" className={`${header} ${desktopOnly}`}>
                {drivers ? "Team" : "Drivers"}
              </th>
              <th scope="col" className={`${header} pr-2`}>
                {drivers ? "Last 5" : "Best · last 5"}
              </th>
              <th
                scope="col"
                className={`${header} ${desktopOnly} lg:text-right`}
              >
                Wins
              </th>
              <th
                scope="col"
                className={`${header} ${desktopOnly} lg:text-right`}
              >
                Gap
              </th>
              <th scope="col" className={cn(header, "w-11 text-right")}>
                <abbr title="Points" className="no-underline">
                  Pts
                </abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.rows.map((row, index) => {
              const gap = index
                ? `-${+(leader - row.points).toFixed(1)}`
                : "LEADER";
              return (
                // The name's link stretches over the whole row
                <tr
                  key={row.id}
                  className="relative transition-colors hover:bg-surface"
                >
                  <td
                    className={`${cell} font-mono text-sm font-bold lg:text-[15px]`}
                  >
                    {row.position}
                  </td>
                  <td className={`${cell} max-w-0 pr-2`}>
                    <div className="flex items-center gap-2 lg:gap-2.5">
                      <TeamBar color={row.color} height={30} />
                      <div className="flex min-w-0 flex-col">
                        <Link
                          href={row.href}
                          className="truncate text-[15px] font-bold after:absolute after:inset-0 hover:underline"
                        >
                          {row.name}
                        </Link>
                        <span className="truncate font-mono text-[10px] text-muted lg:hidden">
                          {drivers && row.detail
                            ? `${row.detail} · ${gap}`
                            : gap}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`${cell} ${desktopOnly} whitespace-nowrap ${drivers ? "text-sm text-soft" : "font-mono text-xs text-muted"}`}
                  >
                    {row.detail}
                  </td>
                  <td className={`${cell} pr-2`}>
                    <FormChips form={forms[row.id]} size={18} />
                  </td>
                  <td
                    className={`${cell} ${desktopOnly} text-right font-mono text-sm text-soft`}
                  >
                    {row.wins}
                  </td>
                  <td
                    className={`${cell} ${desktopOnly} text-right font-mono text-xs text-muted`}
                  >
                    {gap}
                  </td>
                  <td
                    className={`${cell} text-right font-mono text-[15px] font-bold lg:text-base`}
                  >
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <FormLegend />
    </section>
  );
};

export const StandingsTableSkeleton = () => (
  <LoadingRegion label="Loading standings">
    <ListSkeleton rows={10} />
  </LoadingRegion>
);
