import Link from "next/link";
import { LocalTime, TrackTime, UtcOffset } from "@/components/time/LocalTime";
import { Skeleton } from "@/components/ui/Skeleton";
import { getSeasonSchedule } from "@/lib/api/jolpica";
import { raceHref } from "@/lib/domain/routes";
import { findNextSession } from "@/lib/domain/sessions";
import { getRequestTime } from "@/lib/requestTime";

// "● NEXT  PRACTICE 1 · SINGAPORE  FRI 09 05:30" strip at the top of Home.
// Desktop has room for the race name, the date and the offset.
export const NextSessionTicker = async () => {
  const now = await getRequestTime();
  const races = await getSeasonSchedule("current");
  const next = findNextSession(races, now);
  if (!next) return null;

  const { race, session } = next;

  return (
    <Link
      href={`${raceHref(race, races)}/schedule`}
      className="flex min-h-9 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-sm border border-accent/40 bg-accent/12 px-3 font-mono text-[11px] tracking-[1px] uppercase transition-colors hover:bg-accent/20 lg:min-h-10 lg:gap-x-3.5 lg:rounded-md lg:px-3.5 lg:py-2 lg:text-xs"
    >
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full bg-accent shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
      />
      <span className="text-accent-ink">Next</span>
      <span className="min-w-0 flex-1 truncate">
        {session.name} ·{" "}
        <span className="lg:hidden">{race.Circuit.Location.country}</span>
        <span className="max-lg:hidden">{race.raceName}</span>
      </span>
      <span className="font-bold">
        {session.hasTime ? (
          <>
            <span className="lg:hidden">
              <LocalTime value={session.start} format="dayClock" />
            </span>
            <span className="max-lg:hidden">
              <LocalTime value={session.start} format="dayDate" /> ·{" "}
              <LocalTime value={session.start} format="clock" />{" "}
              <UtcOffset at={session.start} />
            </span>
          </>
        ) : (
          // Only the date is known, and the API gives it in UTC
          <TrackTime value={session.start} format="day" timeZone="UTC" />
        )}
      </span>
    </Link>
  );
};

export const NextSessionTickerSkeleton = () => (
  <Skeleton className="h-9 rounded-sm bg-surface lg:h-10 lg:rounded-md" />
);
