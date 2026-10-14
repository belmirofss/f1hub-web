import Link from "next/link";
import type { Race } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { textOn } from "@/lib/color";
import {
  calendarHref,
  formatWeekendDates,
  getMonthLabel,
  getPlaceName,
  getTimelineLayout,
  type TimelineFilter,
  type TimelineRound,
} from "@/lib/domain/calendar";
import { isNightRace } from "@/lib/domain/circuits";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import {
  formatRaceDay,
  isSprintWeekend,
  type RoundState,
} from "@/lib/domain/sessions";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";
import { SprintBadge } from "./Posters";

export const DETAILS_ID = "round-details";

const percent = (at: number) => `${(at * 100).toFixed(2)}%`;

export const matchesFilter = (race: Race, filter: TimelineFilter) =>
  filter === "sprints"
    ? isSprintWeekend(race)
    : filter === "night"
      ? isNightRace(race.Circuit.circuitId)
      : true;

// What a tile says to screen readers: "Round 17, Singapore Grand Prix,
// 09–11 OCT, sprint, night race: next race"
const describeRound = ({ race, winner, isNext }: TimelineRound) =>
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

type StripProps = {
  rounds: TimelineRound[];
  filter: TimelineFilter;
  selected?: string;
};

// The tile's colours: paper for a finished round, vermilion for the next
// one, an outline for the rest
const tileClasses = ({ isPast, isNext }: TimelineRound) =>
  isNext
    ? "border-accent bg-accent text-on-accent"
    : isPast
      ? "border-line bg-surface text-text"
      : "border-line bg-background text-muted";

// Desktop: months across, each race a tile at its race day, back-to-backs
// on a second lane, long gaps labelled and a TODAY line. Narrow windows
// scroll it sideways rather than squeeze the tiles together.
const HorizontalStrip = ({
  rounds,
  filter,
  selected,
  months,
  gaps,
  today,
}: StripProps & Omit<ReturnType<typeof getTimelineLayout>, "rounds">) => (
  <div className="overflow-x-auto max-lg:hidden">
    <div className="relative h-[240px] min-w-[880px]">
      {months.map((month) => (
        <span
          key={month.label}
          aria-hidden
          className="absolute inset-y-0 border-l border-line pt-0.5 pl-1.5 font-mono text-[11px] tracking-[0.12em] text-muted"
          style={{ left: percent(month.at) }}
        >
          {month.label}
        </span>
      ))}
      {gaps.map((gap) => (
        <span
          key={gap.at}
          aria-hidden
          className="absolute top-[194px] -translate-x-1/2 text-xs whitespace-nowrap text-muted"
          style={{ left: percent(gap.at) }}
        >
          ← {gap.summer ? "summer break" : `${gap.weeks} weeks off`} →
        </span>
      ))}
      {today && (
        <>
          <span
            aria-hidden
            className="absolute top-[18px] bottom-0 border-l-2 border-accent-ink"
            style={{ left: percent(today.at) }}
          />
          <span
            className="absolute top-[222px] pl-1.5 font-mono text-[10px] font-bold whitespace-nowrap text-accent-ink"
            style={{ left: percent(today.at) }}
          >
            TODAY · {today.label}
          </span>
        </>
      )}
      <ol aria-label="Rounds on the season's timeline">
        {rounds.map((round) => {
          const { race, winner, isNext, lane } = round;
          const color =
            winner && getTeamColor(winner.Constructor.constructorId);
          const isSelected = race.round === selected;
          return (
            <li
              key={race.round}
              className="absolute -translate-x-1/2"
              style={{ left: percent(round.at), top: 26 + lane * 84 }}
            >
              <Link
                href={calendarHref({
                  view: "timeline",
                  only: filter,
                  round: race.round,
                })}
                scroll={false}
                aria-current={isSelected ? "true" : undefined}
                title={`R${race.round} ${race.raceName}`}
                className={cn(
                  "relative flex h-[76px] w-10 flex-col items-center justify-between overflow-hidden border pt-1.5 transition-opacity hover:opacity-80",
                  tileClasses(round),
                  isSelected && "outline-2 outline-offset-2 outline-text",
                  !matchesFilter(race, filter) && "opacity-30",
                )}
              >
                <span className="sr-only">{describeRound(round)}</span>
                <span aria-hidden className="font-mono text-[10px]">
                  R{race.round}
                </span>
                <span aria-hidden className="text-xs font-extrabold">
                  {getCountryCode3ByName(race.Circuit.Location.country)}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "h-3.5 w-full text-center font-mono text-[9px] leading-3.5 font-bold",
                    isNext && "bg-on-accent text-accent-ink",
                  )}
                  style={
                    color
                      ? { backgroundColor: color, color: textOn(color) }
                      : undefined
                  }
                >
                  {winner ? getDriverCode(winner.Driver) : isNext && "NEXT"}
                </span>
                {isSprintWeekend(race) && (
                  <span
                    aria-hidden
                    className="absolute top-0 right-0 size-2 bg-sprint"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  </div>
);

// Phones: the strip turns vertical. Months run down the left, and the rows
// are spaced by the time between races.
const VerticalStrip = ({ rounds, filter, selected }: StripProps) => {
  const races = rounds.map((round) => round.race);
  return (
    <ol aria-label="Rounds on the season's timeline" className="lg:hidden">
      {rounds.map((round, index) => {
        const { race, winner, isPast, isNext, gap } = round;
        const color = winner && getTeamColor(winner.Constructor.constructorId);
        const month = getMonthLabel(race, rounds[index - 1]?.race);
        const isSelected = race.round === selected;
        const weeks = Math.round(gap / 7);
        return (
          <li key={race.round} className="grid grid-cols-[40px_minmax(0,1fr)]">
            <span
              aria-hidden
              className="self-end font-mono text-[10px] leading-12 tracking-[0.1em] text-muted"
            >
              {month}
            </span>
            <div
              className="flex flex-col border-l-2 border-line pl-3"
              style={{ paddingTop: Math.max(4, (gap - 7) * 2) }}
            >
              {weeks >= 2 && (
                <span className="pb-1.5 text-xs text-muted">
                  {weeks} weeks since the last race
                </span>
              )}
              <Link
                href={`${calendarHref({ view: "timeline", only: filter, round: race.round })}#${DETAILS_ID}`}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "grid min-h-12 grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2.5 border border-l-[5px] pr-3 pl-2.5",
                  tileClasses(round),
                  !isPast && !isNext && "text-soft",
                  isSelected && "outline-2 -outline-offset-2 outline-text",
                  !matchesFilter(race, filter) && "opacity-30",
                )}
                style={{
                  borderLeftColor:
                    color ??
                    (isNext ? "var(--color-text)" : "var(--color-line)"),
                }}
              >
                <span className="font-mono text-xs">
                  <span className="sr-only">Round </span>R{race.round}
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[15px] font-bold">
                    {getPlaceName(race, races)}
                  </span>
                  {isSprintWeekend(race) && <SprintBadge />}
                </span>
                <span className="flex items-center gap-2">
                  {winner && color ? (
                    <span
                      title={getDriverName(winner.Driver)}
                      className="px-1.5 py-0.5 font-mono text-xs font-bold"
                      style={{ backgroundColor: color, color: textOn(color) }}
                    >
                      <span className="sr-only">Winner: </span>
                      {getDriverCode(winner.Driver)}
                    </span>
                  ) : (
                    isNext && (
                      <span className="bg-on-accent px-1.5 py-0.5 font-mono text-xs font-bold text-accent-ink">
                        NEXT
                      </span>
                    )
                  )}
                  <span className="font-mono text-xs">
                    {formatRaceDay(race)}
                  </span>
                </span>
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

// The season on a real date axis: across on desktop, down on phones. A tile
// picks the round whose details show under the strip.
export const Timeline = ({
  rows,
  filter,
  selected,
  now,
}: Omit<StripProps, "rounds"> & { rows: RoundState[]; now: number }) => {
  const layout = getTimelineLayout(rows, now);
  return (
    <>
      <HorizontalStrip
        {...layout}
        rounds={layout.rounds}
        filter={filter}
        selected={selected}
      />
      <VerticalStrip
        rounds={layout.rounds}
        filter={filter}
        selected={selected}
      />
    </>
  );
};
