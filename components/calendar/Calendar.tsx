import { Suspense } from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { Segmented } from "@/components/ui/Segmented";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import {
  getCurrentSeason,
  getSeasonSchedule,
  getSeasonWinners,
} from "@/lib/api/jolpica";
import type { Race, RaceResults } from "@/lib/api/types";
import {
  calendarHref,
  getMonthSelection,
  type CalendarQuery,
  type CalendarView,
  type PosterFilter,
  type TimelineFilter,
} from "@/lib/domain/calendar";
import { getRoundStates, type RoundState } from "@/lib/domain/sessions";
import { getRequestTime } from "@/lib/requestTime";
import { JumpLink } from "./JumpLink";
import { MonthGrid, MonthNav } from "./Month";
import { Posters, roundId } from "./Posters";
import { RoundDetails, RoundDetailsSkeleton } from "./RoundDetails";
import { DETAILS_ID, Timeline } from "./Timeline";

// Winners colour the posters and the timeline. If that request fails the
// calendar still shows, just without them.
const loadWinners = async (): Promise<RaceResults[]> => {
  try {
    return await getSeasonWinners("current");
  } catch (error) {
    console.error(error);
    return [];
  }
};

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
// next round; on the timeline and the month grid it picks it.
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
    <Link
      href={`${calendarHref({ ...query, month: undefined, round: race.round })}#${DETAILS_ID}`}
      className={NEXT_BUTTON}
    >
      {children}
    </Link>
  );
};

// The season in three views, picked by the URL so all are server-rendered
// and shareable: a wall of race posters (the default), a timeline on a
// real date axis or a month-by-month grid, the last two with the selected
// round's details under them
export const Calendar = async ({ query }: { query: CalendarQuery }) => {
  const now = await getRequestTime();
  const [season, races, winners] = await Promise.all([
    getCurrentSeason(),
    getSeasonSchedule("current"),
    loadWinners(),
  ]);

  if (!races.length) {
    return (
      <>
        <PageHeader title="Calendar" meta={season} />
        <EmptyState>
          The calendar for this season isn&apos;t out yet.
        </EmptyState>
      </>
    );
  }

  const rows = getRoundStates(races, winners, now);
  const done = rows.filter((row) => row.isPast).length;
  const next = rows.find((row) => row.isNext);
  // The timeline shows the next round until another is picked, and the
  // finale once the season is over
  const picked =
    rows.find((row) => row.race.round === query.round) ?? next ?? rows.at(-1)!;
  // The month grid keeps to its month, which may have no races at all
  const month = query.view === "month" ? getMonthSelection(rows, query) : null;
  const selected = month ? month.selected : picked;

  return (
    <>
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
              selected={picked.race.round}
              now={now}
            />
          )}
          {selected && (
            <Suspense
              key={selected.race.round}
              fallback={<RoundDetailsSkeleton />}
            >
              <RoundDetails row={selected} races={races} now={now} />
            </Suspense>
          )}
        </>
      )}
      {next && <NextRaceButton race={next.race} query={query} />}
    </>
  );
};

const HeaderSkeleton = () => (
  <div className="flex flex-col gap-3 pt-[18px] lg:pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Skeleton className="h-9 w-40 lg:h-[54px] lg:w-72" />
      <Skeleton className="h-11 w-full rounded-full sm:w-72" />
    </div>
    <Skeleton className="h-11 w-full rounded-full lg:max-w-md" />
  </div>
);

export const PostersSkeleton = () => (
  <div className="grid auto-rows-[172px] grid-cols-2 gap-2.5 md:auto-rows-[220px] md:grid-cols-3 lg:auto-rows-[248px] lg:grid-cols-6 lg:gap-3">
    {Array.from({ length: 12 }, (_, index) => (
      <Skeleton key={index} />
    ))}
  </div>
);

export const TimelineSkeleton = () => (
  <>
    <Skeleton className="h-[240px] max-lg:hidden" />
    <div className="flex flex-col gap-2 lg:hidden">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="ml-[52px] h-12" />
      ))}
    </div>
    <RoundDetailsSkeleton />
  </>
);

export const MonthSkeleton = () => (
  <>
    <Skeleton className="h-[372px] md:h-[680px]" />
    <RoundDetailsSkeleton />
  </>
);

export const CalendarSkeleton = ({ view }: { view?: CalendarView }) => (
  <LoadingRegion className="flex flex-col gap-3.5 lg:gap-5">
    <HeaderSkeleton />
    {view === "timeline" ? (
      <TimelineSkeleton />
    ) : view === "month" ? (
      <MonthSkeleton />
    ) : (
      <PostersSkeleton />
    )}
  </LoadingRegion>
);
