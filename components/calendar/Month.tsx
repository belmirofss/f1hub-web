import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShallowLink } from "@/components/ui/ShallowLink";
import type { Race } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { textOn } from "@/lib/color";
import {
  calendarHref,
  formatMonthName,
  formatWeekendDates,
  getMonthLayout,
  getPlaceName,
  type MonthCell,
} from "@/lib/domain/calendar";
import { isNightRace } from "@/lib/domain/circuits";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import { isSprintWeekend, type RoundState } from "@/lib/domain/sessions";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";
import { plural } from "@/lib/metadata";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const NAV_BUTTON =
  "flex size-11 shrink-0 items-center justify-center rounded-full border border-line";

// "‹ October · 3 rounds ›", stepping through the season's months
export const MonthNav = ({
  months,
  month,
  rounds,
}: {
  months: number[];
  month: number;
  rounds: number;
}) => {
  const index = months.indexOf(month);
  const step = (offset: -1 | 1) => {
    const target = months[index + offset];
    const Icon = offset < 0 ? ChevronLeft : ChevronRight;
    const icon = <Icon aria-hidden size={18} strokeWidth={2} />;
    if (target === undefined) {
      return (
        <span aria-hidden className={cn(NAV_BUTTON, "text-subtle")}>
          {icon}
        </span>
      );
    }
    return (
      <ShallowLink
        href={calendarHref({ view: "month", month: target })}
        aria-label={`${offset < 0 ? "Previous" : "Next"} month: ${formatMonthName(target)}`}
        className={cn(
          NAV_BUTTON,
          "relative transition-colors hover:border-text",
        )}
      >
        {icon}
      </ShallowLink>
    );
  };

  return (
    <nav aria-label="Month" className="flex items-center gap-2 lg:max-w-md">
      {step(-1)}
      <p className="flex flex-1 items-baseline justify-center gap-2">
        <span className="text-lg font-extrabold">{formatMonthName(month)}</span>
        <span className="font-mono text-xs text-muted">
          {rounds ? plural(rounds, "round") : "No races"}
        </span>
      </p>
      {step(1)}
    </nav>
  );
};

// What a race day says to screen readers: "Round 17, Singapore Grand Prix,
// 09–11 OCT, sprint, night race: won by Lando Norris, McLaren"
const describeRound = ({ race, winner, isNext }: RoundState) =>
  [
    `Round ${race.round}, ${race.raceName}, ${formatWeekendDates(race)}`,
    isSprintWeekend(race) && "sprint",
    isNightRace(race.Circuit.circuitId) && "night race",
  ]
    .filter(Boolean)
    .join(", ") +
  (winner
    ? `: won by ${getDriverName(winner.Driver)}, ${winner.Constructor.name}`
    : isNext
      ? ": next race"
      : "");

// The band across the top of a weekend's days: the winner's team colour, the
// accent for the next round and a dashed grey for the rest
const bandColor = ({ winner, isNext }: RoundState) =>
  winner
    ? getTeamColor(winner.Constructor.constructorId)
    : isNext
      ? "var(--color-accent)"
      : "var(--color-line-dashed)";

const Day = ({
  cell,
  races,
  month,
  selected,
}: {
  cell: MonthCell;
  races: Race[];
  month: number;
  selected?: string;
}) => {
  const { row, sessions, isRaceDay, inMonth, isToday, day } = cell;
  const winner = row?.winner;
  const color = winner && getTeamColor(winner.Constructor.constructorId);
  const isSelected = !!row && row.race.round === selected;

  return (
    <td
      className={cn(
        "relative h-14 border border-line p-0 align-top md:h-[108px]",
        row && (row.isPast ? "bg-surface" : row.isNext && "bg-accent/8"),
        // A rule under the picked weekend, unbroken across its days
        isSelected && "shadow-[inset_0_-3px_0_var(--color-text)]",
      )}
    >
      <div
        className={cn(
          "flex h-full flex-col gap-1 p-1 md:p-2",
          !inMonth && "opacity-45",
        )}
      >
        {row && (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ backgroundColor: bandColor(row) }}
          />
        )}
        <span className="flex items-start justify-between">
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full font-mono text-[11px] md:text-xs",
              isToday
                ? "bg-text font-bold text-background"
                : inMonth
                  ? "text-soft"
                  : "text-subtle",
            )}
          >
            {day}
            {isToday && <span className="sr-only">, today</span>}
          </span>
          {row && isSprintWeekend(row.race) && (
            <span aria-hidden className="mt-1 size-2 bg-sprint" />
          )}
        </span>
        {row && (
          <>
            {isRaceDay && (
              <span
                aria-hidden
                className="flex min-w-0 flex-col gap-0.5 md:gap-1"
              >
                <span className="font-mono text-[9px] text-muted max-md:hidden">
                  R{row.race.round}
                </span>
                <span className="truncate text-[11px] font-extrabold md:hidden">
                  {getCountryCode3ByName(row.race.Circuit.Location.country)}
                </span>
                <span className="truncate text-sm leading-tight font-bold max-md:hidden">
                  {getPlaceName(row.race, races)}
                </span>
                {winner && color ? (
                  <span
                    className="self-start px-1 font-mono text-[9px] leading-4 font-bold md:text-[10px]"
                    style={{ backgroundColor: color, color: textOn(color) }}
                  >
                    {getDriverCode(winner.Driver)}
                  </span>
                ) : (
                  row.isNext && (
                    <span className="self-start bg-accent px-1 font-mono text-[9px] leading-4 font-bold text-on-accent md:text-[10px]">
                      NEXT
                    </span>
                  )
                )}
              </span>
            )}
            <span
              aria-hidden
              className="mt-auto flex flex-wrap gap-x-1.5 font-mono text-[10px] text-muted max-md:hidden"
            >
              {sessions
                .filter((session) => session.key !== "race")
                .map((session) => (
                  <span key={session.key}>{session.short}</span>
                ))}
            </span>
            {/* Every day of the weekend picks the round, but only race day is
                a stop for the keyboard and screen readers */}
            <ShallowLink
              href={calendarHref({
                view: "month",
                // A day from a month either side opens that month
                month: inMonth ? month : Number(cell.date.slice(5, 7)),
                round: row.race.round,
              })}
              aria-current={isSelected && isRaceDay ? "true" : undefined}
              aria-hidden={isRaceDay ? undefined : true}
              tabIndex={isRaceDay ? undefined : -1}
              title={`R${row.race.round} ${row.race.raceName}`}
              className="absolute inset-0 transition-colors hover:bg-text/5"
            >
              {isRaceDay && (
                <span className="sr-only">{describeRound(row)}</span>
              )}
            </ShallowLink>
          </>
        )}
      </div>
    </td>
  );
};

// The season as a wall calendar, a month at a time: each weekend's sessions
// on their days at the track, race day named, and the picked round's
// details under the grid
export const MonthGrid = ({
  rows,
  races,
  year,
  month,
  selected,
  now,
}: {
  rows: RoundState[];
  races: Race[];
  year: number;
  month: number;
  selected?: string;
  now: number;
}) => {
  const weeks = getMonthLayout(rows, year, month, now);
  return (
    <table className="w-full table-fixed border-collapse">
      <caption className="sr-only">
        {formatMonthName(month)} {year}
      </caption>
      <thead>
        <tr>
          {WEEKDAYS.map((weekday) => (
            <th
              key={weekday}
              scope="col"
              abbr={weekday}
              className="pb-1.5 text-left font-mono text-[10px] font-normal tracking-[0.12em] text-muted uppercase md:pl-2"
            >
              <span className="sr-only">{weekday}</span>
              <span aria-hidden className="max-md:hidden">
                {weekday.slice(0, 3)}
              </span>
              <span aria-hidden className="pl-1 md:hidden">
                {weekday[0]}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0].date}>
            {week.map((cell) => (
              <Day
                key={cell.date}
                cell={cell}
                races={races}
                month={month}
                selected={selected}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
