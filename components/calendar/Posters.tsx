import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import type { Race } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { textOn } from "@/lib/color";
import {
  countWinners,
  formatWeekendDates,
  getPlaceName,
  getTeamWins,
  type PosterFilter,
} from "@/lib/domain/calendar";
import { isNightRace } from "@/lib/domain/circuits";
import { raceHref } from "@/lib/domain/routes";
import {
  getSessionEnd,
  getSessions,
  getWeekendStart,
  isSprintWeekend,
  type RoundState,
} from "@/lib/domain/sessions";
import { getTeamColor } from "@/lib/domain/teams";
import { plural } from "@/lib/metadata";
import { ScrollToRound } from "./ScrollToRound";
import { SessionCountdown } from "./SessionCountdown";
import { CircuitOutline } from "./TrackOutline";

export const roundId = (race: Race) => `r${race.round}`;

const DAY = 24 * 3600000;

type PosterProps = {
  row: RoundState;
  races: Race[];
  className?: string;
};

export const SprintBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "bg-sprint px-1 font-mono text-[9px] leading-4 font-bold tracking-[0.06em] text-text",
      className,
    )}
  >
    SPRINT
  </span>
);

// The round number, big and faint behind the poster. Drawn as generated
// content: it's decoration, and contrast checkers would read it as faint text.
const Numeral = ({
  round,
  className,
}: {
  round: string;
  className: string;
}) => (
  <span
    aria-hidden
    data-round={round}
    className={cn(
      "absolute font-display leading-none font-black select-none before:content-[attr(data-round)]",
      className,
    )}
  />
);

// A finished round on paper with the winner's team band at the foot, or a
// round still to come in outline with a dashed track
const Poster = ({ row, races, className }: PosterProps) => {
  const { race, winner, isPast } = row;
  const { circuitId, circuitName, Location } = race.Circuit;
  const color = winner && getTeamColor(winner.Constructor.constructorId);
  const place = getPlaceName(race, races);
  // Under the name of a round to come: the city (or the circuit when the
  // name is already the city), whether it's at night, or that it's the last
  const note =
    race === races.at(-1)
      ? "Finale"
      : [
          place === Location.locality ? circuitName : Location.locality,
          isNightRace(circuitId) && "night",
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <li id={roundId(race)} className={cn("scroll-mt-16", className)}>
      <Link
        href={raceHref(race, races)}
        className={cn(
          "group relative flex h-full flex-col justify-between gap-2 overflow-hidden p-3.5 lg:p-4",
          isPast
            ? "bg-surface hover:bg-surface-raised/60"
            : "border border-line hover:border-text",
        )}
      >
        <Numeral
          round={race.round}
          className={cn(
            "-top-2 right-2 text-[72px] lg:-top-2.5 lg:right-2.5 lg:text-[92px]",
            isPast ? "text-surface-raised" : "text-surface",
          )}
        />
        <span className="relative flex flex-wrap items-center gap-1.5">
          <span className="sr-only">Round {race.round}, </span>
          <span
            className={cn(
              "font-mono text-[10px] lg:text-[11px]",
              isPast ? "text-muted" : "text-accent-ink",
            )}
          >
            {formatWeekendDates(race)}
          </span>
          {isSprintWeekend(race) && <SprintBadge />}
        </span>
        <CircuitOutline
          circuitId={circuitId}
          dashed={!isPast}
          className={cn(
            "relative h-12 w-20 self-start lg:h-[66px] lg:w-[110px]",
            isPast ? "text-soft" : "text-muted",
          )}
        />
        <span className="relative flex flex-col gap-1">
          <span
            className={cn(
              "display-title text-base group-hover:underline lg:text-xl",
              !isPast && "text-soft",
            )}
          >
            {place}
          </span>
          {!winner && (
            <span className="truncate text-xs text-muted">{note}</span>
          )}
        </span>
        {winner && color && (
          <span
            className="relative -mx-3.5 -mb-3.5 truncate px-3.5 py-2 text-xs font-bold lg:-mx-4 lg:-mb-4 lg:px-4 lg:py-2.5 lg:text-[13px]"
            style={{ backgroundColor: color, color: textOn(color) }}
          >
            <span className="sr-only">Winner: </span>
            <span aria-hidden>1 · </span>
            {winner.Driver.familyName}
          </span>
        )}
      </Link>
    </li>
  );
};

// The next round, twice the size in vermilion: where and when, the outline,
// a countdown to its next session and a way into the weekend. On phones it
// spans the full width.
const NextPoster = ({ row, races, now }: PosterProps & { now: number }) => {
  const { race } = row;
  const sessions = getSessions(race)
    .filter((session) => session.hasTime)
    .map((session) => ({
      name: session.name,
      start: session.start.getTime(),
      end: getSessionEnd(session),
    }));
  const thisWeekend = getWeekendStart(race).getTime() - now < 4 * DAY;
  const details = [
    race.Circuit.circuitName,
    isSprintWeekend(race) && "Sprint",
    isNightRace(race.Circuit.circuitId) && "Night",
  ].filter(Boolean);

  return (
    <li id={roundId(race)} className="col-span-2 scroll-mt-16 md:row-span-2">
      <Link
        href={raceHref(race, races)}
        className="group relative flex h-full flex-col gap-2 overflow-hidden bg-accent p-5 text-on-accent transition-[filter] hover:brightness-105 lg:gap-2.5 lg:p-6"
      >
        <Numeral
          round={race.round}
          className="-top-7 -right-1.5 text-[180px] opacity-15 lg:-top-10 lg:-right-2.5 lg:text-[260px]"
        />
        <span className="relative font-mono text-[11px] tracking-[0.12em] lg:text-xs lg:tracking-[0.14em]">
          <span className="sr-only">Round {race.round}, </span>
          {thisWeekend ? "THIS WEEKEND" : "NEXT"} · {formatWeekendDates(race)}
        </span>
        <span className="relative display-title text-[38px] leading-[0.9] lg:text-[52px]">
          {getPlaceName(race, races)}
        </span>
        <span className="relative text-sm font-semibold lg:text-[15px]">
          {details.join(" · ")}
        </span>
        <CircuitOutline
          circuitId={race.Circuit.circuitId}
          strokeWidth={6}
          className="relative my-1 h-[100px] w-[170px] self-start lg:h-[156px] lg:w-[260px]"
        />
        <span className="relative mt-auto flex flex-wrap items-end justify-between gap-3">
          <SessionCountdown sessions={sessions} serverNow={now} />
          <span className="flex items-center gap-1 text-sm font-extrabold group-hover:underline">
            Open weekend
            <ArrowRight aria-hidden size={16} strokeWidth={2.5} />
          </span>
        </span>
      </Link>
    </li>
  );
};

// Wins by team as one bar, with the count of different winners
const WinsTile = ({ rows }: { rows: RoundState[] }) => {
  const wins = getTeamWins(rows);
  if (!wins.length) return null;
  const winners = countWinners(rows);

  return (
    <section
      aria-labelledby="wins-so-far"
      className="col-span-2 flex flex-col gap-3 bg-surface p-4 lg:p-5"
    >
      <h2 id="wins-so-far" className="section-label">
        Wins so far
      </h2>
      <div aria-hidden className="flex h-4 gap-0.5">
        {wins.map(({ team, count }) => (
          <span
            key={team.constructorId}
            style={{
              flexGrow: count,
              backgroundColor: getTeamColor(team.constructorId),
            }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-soft">
        {wins.map(({ team, count }) => (
          <li key={team.constructorId}>
            {team.name} {count}
            <span className="sr-only">{count === 1 ? " win" : " wins"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto text-[13px] text-muted">
        {plural(winners, "winner")} from {plural(wins.length, "team")}
      </p>
    </section>
  );
};

// The double-size poster can't start in a row's last column. Rather than
// leave that cell empty, or let a later round fill it out of order, the
// poster before it widens to the end of the row: 2 columns on phones, 3 on
// tablets, 6 on desktop.
const getGapFiller = (before: number) =>
  cn(
    before % 2 === 1 && "max-md:col-span-2",
    before % 3 === 2 && "md:max-lg:col-span-2",
    before % 6 === 5 && "lg:col-span-2",
  );

// The season as a wall of race posters: 2 columns on phones, 3 on tablets
// and 6 on desktop. "Around now" shows every round and opens at the next
// one; "Done" and "To go" split the season at it.
export const Posters = ({
  rows,
  races,
  filter,
  now,
}: {
  rows: RoundState[];
  races: Race[];
  filter: PosterFilter;
  now: number;
}) => {
  const shown = rows.filter((row) =>
    filter === "done" ? row.isPast : filter === "todo" ? !row.isPast : true,
  );
  const next = rows.find((row) => row.isNext);
  const beforeNext = shown.findIndex((row) => row.isNext);

  if (!shown.length) {
    return (
      <EmptyState>
        {filter === "done"
          ? "No race has been run yet this season."
          : "Every race of the season has been run."}
      </EmptyState>
    );
  }

  return (
    <>
      {/* The list's box is left out so the summary tile shares its grid;
          role="list" keeps it a list in Safari. */}
      <div className="grid auto-rows-[minmax(172px,auto)] grid-cols-2 gap-2.5 md:auto-rows-[220px] md:grid-cols-3 lg:auto-rows-[248px] lg:grid-cols-6 lg:gap-3">
        <ol
          role="list"
          aria-label={`${races[0].season} races`}
          className="contents"
        >
          {shown.map((row, index) =>
            row.isNext ? (
              <NextPoster
                key={row.race.round}
                row={row}
                races={races}
                now={now}
              />
            ) : (
              <Poster
                key={row.race.round}
                row={row}
                races={races}
                className={
                  index === beforeNext - 1
                    ? getGapFiller(beforeNext)
                    : undefined
                }
              />
            ),
          )}
        </ol>
        {filter !== "todo" && <WinsTile rows={rows} />}
      </div>
      {filter === "around" && next && (
        <ScrollToRound target={roundId(next.race)} />
      )}
    </>
  );
};
