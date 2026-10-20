"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useNow } from "@/components/time/useNow";
import { Segmented } from "@/components/ui/Segmented";
import type { Race } from "@/lib/api/types";
import {
  calendarHref,
  getMonthSelection,
  getSelectedRound,
  parseCalendarQuery,
  type CalendarQuery,
  type CalendarView,
  type PastWinner,
  type PosterFilter,
  type TimelineFilter,
} from "@/lib/domain/calendar";
import { markRoundStates, type RoundState } from "@/lib/domain/sessions";
import { JumpLink } from "./JumpLink";
import { MonthGrid, MonthNav } from "./Month";
import { PickRoundLink } from "./PickRoundLink";
import { Posters, roundId } from "./Posters";
import { RoundDetails } from "./RoundDetails";
import { ScrollToRound } from "./ScrollToRound";
import { SeasonDataContext, type SeasonData } from "./SeasonData";
import { DETAILS_ID, Timeline } from "./Timeline";

const ViewSwitch = ({
  view,
  className,
}: {
  view: CalendarView;
  className?: string;
}) => (
  <Segmented<CalendarView>
    label="Calendar view"
    value={view}
    shallow
    className={className}
    options={[
      { value: "posters", label: "Posters", href: calendarHref({}) },
      {
        value: "timeline",
        label: "Timeline",
        href: calendarHref({ view: "timeline" }),
      },
      {
        value: "month",
        label: "Month",
        href: calendarHref({ view: "month" }),
      },
    ]}
  />
);

const PosterFilters = ({
  rows,
  show,
}: {
  rows: RoundState[];
  show: PosterFilter;
}) => {
  const done = rows.filter((row) => row.isPast).length;
  return (
    <Segmented<PosterFilter>
      label="Show rounds"
      value={show}
      shallow
      className="lg:max-w-md"
      options={[
        {
          value: "done",
          label: `Done · ${done}`,
          href: calendarHref({ show: "done" }),
        },
        { value: "around", label: "Around now", href: calendarHref({}) },
        {
          value: "todo",
          label: `To go · ${rows.length - done}`,
          href: calendarHref({ show: "todo" }),
        },
      ]}
    />
  );
};

const TimelineFilters = ({ query }: { query: CalendarQuery }) => {
  const href = (only: TimelineFilter) => calendarHref({ ...query, only });
  return (
    <Segmented<TimelineFilter>
      label="Highlight rounds"
      value={query.only}
      shallow
      className="lg:max-w-md"
      options={[
        { value: "all", label: "All", href: href("all") },
        { value: "sprints", label: "Sprints", href: href("sprints") },
        { value: "night", label: "Night races", href: href("night") },
      ]}
    />
  );
};

const NEXT_BUTTON =
  "sticky bottom-[calc(80px+max(12px,env(safe-area-inset-bottom)))] z-10 flex min-h-11 items-center gap-2 self-end rounded-[22px] bg-accent px-4 text-sm font-bold text-on-accent shadow-[0_6px_18px_rgba(26,24,20,0.2)] transition-[filter] hover:brightness-110 md:bottom-6";

// Floats above the tab bar on phones and in the corner on bigger screens.
// Sticky rather than fixed, so it comes to rest at the end of the calendar
// instead of covering the footer's links. On the posters it glides to the
// next round; on the timeline and the month grid it picks it, or glides to
// its details if they already show it.
const NextRaceButton = ({
  race,
  query,
}: {
  race: Race;
  query: CalendarQuery;
}) => {
  const children = (
    <>
      <ArrowDown aria-hidden size={16} strokeWidth={2} />
      Next: {race.Circuit.Location.locality}
      <span className="sr-only">, jump to the {race.raceName}</span>
    </>
  );
  if (query.view === "posters") {
    return (
      <JumpLink target={roundId(race)} className={NEXT_BUTTON}>
        {children}
      </JumpLink>
    );
  }
  return (
    <PickRoundLink
      href={`${calendarHref({ ...query, month: undefined, round: race.round })}#${DETAILS_ID}`}
      round={race.round}
      details={DETAILS_ID}
      className={NEXT_BUTTON}
    >
      {children}
    </PickRoundLink>
  );
};

// The last winners at circuits picked in the browser, one request each per
// visit. The CDN keeps them, so most arrive in a few dozen milliseconds.
const pastWinners = new Map<string, Promise<PastWinner[] | null>>();

const loadPastWinners = (circuitId: string) => {
  // Only rounds picked in the browser come here; the server renders the
  // round it was asked for with its own winners
  if (typeof window === "undefined") return Promise.resolve(null);
  let load = pastWinners.get(circuitId);
  if (!load) {
    load = fetch(`/api/circuits/${circuitId}/winners`)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
    pastWinners.set(circuitId, load);
  }
  return load;
};

// The season in three views: a wall of race posters (the default), a
// timeline on a real date axis or a month-by-month grid, the last two with
// the selected round's details under them. The URL picks the view, so each
// is server-rendered and shareable, but the season is all here: switching
// views, filters, months and rounds only changes the URL in place and draws
// the new state in the browser, without a request.
export const CalendarBoard = ({
  rounds,
  now: requestTime,
  season,
  winners,
}: {
  // Each round with its winner, if it has one yet
  rounds: Pick<RoundState, "race" | "winner">[];
  // The time the server rendered at, until the browser's clock takes over
  now: number;
  season: SeasonData;
  // The last winners at the round the server was asked for
  winners?: { circuitId: string; list: Promise<PastWinner[] | null> };
}) => {
  const searchParams = useSearchParams();
  const query = useMemo(
    () => parseCalendarQuery(Object.fromEntries(searchParams)),
    [searchParams],
  );
  // The query the calendar was opened at. Only that lands on the next
  // poster: picking "Around now" later keeps the page where it is.
  const [opened] = useState(query);
  // Which round is next moves on while the page stays open
  const now = useNow(60_000) ?? requestTime;
  const rows = useMemo(() => markRoundStates(rounds, now), [rounds, now]);
  const races = useMemo(() => rows.map((row) => row.race), [rows]);
  const done = rows.filter((row) => row.isPast).length;
  const next = rows.find((row) => row.isNext);
  // The month grid keeps to its month, which may have no races at all
  const month = query.view === "month" ? getMonthSelection(rows, query) : null;
  const selected = month ? month.selected : getSelectedRound(rows, query);
  const winnersAt = (circuitId: string) =>
    winners?.circuitId === circuitId
      ? winners.list
      : loadPastWinners(circuitId);

  return (
    <SeasonDataContext value={season}>
      <PageHeader
        title="Calendar"
        meta={`${races[0].season} · ${done}/${races.length}`}
        // Beside the title from 640px. Narrower, the three views don't fit
        // next to it, so the switch gets a row of its own under it.
        actions={<ViewSwitch view={query.view} className="max-sm:hidden" />}
      >
        <ViewSwitch view={query.view} className="sm:hidden" />
        {month ? (
          <MonthNav
            months={month.months}
            month={month.month}
            rounds={month.rounds}
          />
        ) : query.view === "posters" ? (
          <PosterFilters rows={rows} show={query.show} />
        ) : (
          <TimelineFilters query={query} />
        )}
      </PageHeader>
      {query.view === "posters" ? (
        <Posters rows={rows} races={races} filter={query.show} now={now} />
      ) : (
        <>
          {month ? (
            <MonthGrid
              rows={rows}
              races={races}
              year={Number(races[0].season)}
              month={month.month}
              selected={selected?.race.round}
              now={now}
            />
          ) : (
            <Timeline
              rows={rows}
              filter={query.only}
              selected={selected?.race.round}
              now={now}
            />
          )}
          {selected && (
            <RoundDetails
              key={selected.race.round}
              row={selected}
              races={races}
              winners={winnersAt(selected.race.Circuit.circuitId)}
              now={now}
            />
          )}
        </>
      )}
      {next && <NextRaceButton race={next.race} query={query} />}
      {opened.view === "posters" && opened.show === "around" && next && (
        <ScrollToRound target={roundId(next.race)} />
      )}
    </SeasonDataContext>
  );
};
