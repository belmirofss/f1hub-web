// Ported from the app's src/screens/RaceWeekend/QualifyingTab.tsx. Groups by
// the session each driver reached, with gaps to the fastest time in that
// session. Desktop adds the team and every session's time.
import Link from "next/link";
import { TeamBar } from "@/components/ui/Card";
import type { QualifyingResult, RaceBase } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import {
  formatGapMs,
  getBestQualifyingTime,
  getSessionFastestMs,
  groupQualifying,
  lapTimeToMs,
  type QualifyingSession,
} from "@/lib/domain/results";
import { driverHref } from "@/lib/domain/routes";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";

const SESSIONS: QualifyingSession[] = ["Q1", "Q2", "Q3"];

const header =
  "w-px whitespace-nowrap pb-1.5 text-left align-bottom font-medium lg:px-2 lg:pb-2";
const cell = "h-12 border-b border-line-soft lg:h-[46px] lg:px-2";
const desktopOnly = "max-lg:hidden";

export const QualifyingTable = ({
  race,
  results,
}: {
  race: Pick<RaceBase, "season" | "raceName">;
  results: QualifyingResult[];
}) => {
  const groups = groupQualifying(results, Number(race.season));
  const showHeaders = groups.length > 1;
  // Desktop shows a column for each session that ran
  const sessions = SESSIONS.filter((s) => results.some((r) => r[s]));
  const fastest = Object.fromEntries(
    sessions.map((s) => [s, getSessionFastestMs(results, s)]),
  ) as Partial<Record<QualifyingSession, number>>;
  const columns = 4 + sessions.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          {race.raceName} {race.season} qualifying
        </caption>
        {/* Phones only label the groups, like the app */}
        <thead className="font-mono text-[11px] tracking-[1px] text-muted uppercase max-lg:sr-only">
          <tr className="border-b border-line">
            <th scope="col" className={cn(header, "lg:w-12")}>
              <abbr title="Position" className="no-underline">
                Pos
              </abbr>
            </th>
            <th scope="col" className={cn(header, "w-auto")}>
              Driver
            </th>
            <th scope="col" className={cn(header, desktopOnly)}>
              Team
            </th>
            {sessions.map((session) => (
              <th
                key={session}
                scope="col"
                className={cn(header, desktopOnly, "text-right")}
              >
                {session}
              </th>
            ))}
            <th scope="col" className={cn(header, "pl-2 text-right")}>
              <span className="lg:hidden">Time</span>
              <span className="max-lg:hidden">Gap</span>
            </th>
          </tr>
        </thead>
        {groups.map((group, index) => {
          const first = group.results[0].position;
          const last = group.results.at(-1)!.position;
          const session = group.session;
          const fastestMs = session && fastest[session];

          return (
            <tbody key={group.key}>
              {showHeaders && (
                <tr className="border-b border-line">
                  <th
                    scope="colgroup"
                    colSpan={columns}
                    className={cn(
                      "pb-1.5 text-left font-normal",
                      index > 0 && "pt-3.5 lg:pt-5",
                    )}
                  >
                    <span className="flex justify-between gap-3 font-mono text-[11px] font-medium tracking-[1px] text-muted uppercase lg:px-2">
                      <span className={cn(group.key === "q3" && "text-text")}>
                        {group.title}
                      </span>
                      <span>
                        {first === last ? `P${first}` : `P${first}–P${last}`}
                      </span>
                    </span>
                  </th>
                </tr>
              )}
              {group.results.map((result) => {
                const ms = session && lapTimeToMs(result[session]);
                const gap =
                  ms && fastestMs && ms > fastestMs
                    ? formatGapMs(ms - fastestMs)
                    : undefined;
                const { Driver, Constructor } = result;

                return (
                  // The driver's link stretches over the whole row
                  <tr
                    key={Driver.driverId}
                    className="relative transition-colors hover:bg-surface"
                  >
                    <td
                      className={`${cell} w-7 pr-2 font-mono text-sm font-bold lg:w-12`}
                    >
                      {result.position}
                    </td>
                    <td className={`${cell} w-full max-w-0`}>
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
                            {getDriverName(Driver)}
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
                    {sessions.map((s) => (
                      <td
                        key={s}
                        className={cn(
                          cell,
                          desktopOnly,
                          "text-right font-mono text-sm",
                          s === session ? "font-bold" : "text-muted",
                        )}
                      >
                        {/* An empty time means they took part but didn't set one */}
                        {result[s] === "" ? "—" : result[s]}
                      </td>
                    ))}
                    <td
                      className={`${cell} w-px pl-2 text-right font-mono whitespace-nowrap`}
                    >
                      <span className="flex flex-col items-end lg:hidden">
                        <span className="text-[13px] font-bold">
                          {getBestQualifyingTime(result) ?? "—"}
                        </span>
                        {gap && (
                          <span className="text-[11px] text-muted">{gap}</span>
                        )}
                      </span>
                      <span className="text-[13px] text-muted max-lg:hidden">
                        {gap}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
};
