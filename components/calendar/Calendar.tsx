import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import {
  getCurrentSeason,
  getSeasonSchedule,
  getSeasonWinners,
} from "@/lib/api/jolpica";
import type { RaceResults } from "@/lib/api/types";
import { getCircuitOutline } from "@/lib/circuitOutlines";
import { getLastWinners } from "@/lib/circuitWinners";
import {
  getSelectedRound,
  type CalendarQuery,
  type CalendarView,
} from "@/lib/domain/calendar";
import { getRoundStates } from "@/lib/domain/sessions";
import { PLACEHOLDER_OUTLINE } from "@/lib/domain/trackMap";
import { getRequestTime } from "@/lib/requestTime";
import { CalendarBoard } from "./CalendarBoard";
import { RoundDetailsSkeleton } from "./RoundDetails";

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

// Loads the season for the calendar's board, which draws every view in the
// browser from it. The URL's view is rendered here on a direct visit, with
// the selected round's last winners; rounds picked later fetch their own.
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
  // Not awaited: the board streams each outline in when it's ready
  const outlines = Object.fromEntries(
    races.map(({ Circuit: { circuitId } }) => [
      circuitId,
      getCircuitOutline(circuitId).catch(() => PLACEHOLDER_OUTLINE),
    ]),
  );
  const selected = getSelectedRound(rows, query)?.race.Circuit.circuitId;

  return (
    <CalendarBoard
      rows={rows}
      now={now}
      outlines={outlines}
      winners={
        selected
          ? { circuitId: selected, list: getLastWinners(selected) }
          : undefined
      }
    />
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
