import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getCurrentSeason,
  getSeasonSchedule,
  getSeasonWinners,
} from "@/lib/api/jolpica";
import type { RaceResults } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import {
  FIRST_SEASON,
  findRaceBySlug,
  isSeasonYear,
  raceHref,
  seasonHref,
} from "@/lib/domain/routes";
import {
  findNextSession,
  formatRaceDay,
  getRoundStates,
  isSprintWeekend,
} from "@/lib/domain/sessions";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";
import { getRequestTime } from "@/lib/requestTime";
import { SpineTrack, type SpineRound } from "./SpineTrack";

// The season's rounds as a permanent strip under the header: who won each
// one, where the season is now, and one click to any race weekend. Rendered
// by the root layout's @spine slot, which passes the year and race of
// /seasons/[year] and /races/[year]/[slug] URLs.

// Winners colour the cells. If that request fails the spine still shows,
// just without them.
const loadWinners = async (year: number): Promise<RaceResults[]> => {
  try {
    return await getSeasonWinners(year);
  } catch (error) {
    console.error(error);
    return [];
  }
};

// "won from P3", or from the pit lane (grid 0)
const fromGrid = (grid: string) => (grid === "0" ? "the pit lane" : `P${grid}`);

const SeasonSwitcher = ({
  year,
  current,
}: {
  year: number;
  current: number;
}) => {
  const arrow =
    "flex size-8 items-center justify-center text-muted transition-colors hover:bg-surface-raised hover:text-text";
  const previous = year > FIRST_SEASON ? year - 1 : undefined;
  const next = year < current ? year + 1 : undefined;

  return (
    <div className="flex shrink-0 items-center gap-0.5 border-r border-line pr-3 max-md:hidden">
      {previous ? (
        <Link
          href={seasonHref(previous)}
          aria-label={`${previous} season`}
          className={arrow}
        >
          <ChevronLeft aria-hidden size={18} strokeWidth={2} />
        </Link>
      ) : (
        <span aria-hidden className={cn(arrow, "opacity-30")}>
          <ChevronLeft size={18} strokeWidth={2} />
        </span>
      )}
      <Link
        href={year === current ? "/calendar" : seasonHref(year)}
        aria-label={`${year} season`}
        className="px-1 font-display text-[26px] leading-none font-black transition-colors hover:text-accent-ink"
      >
        {year}
      </Link>
      {next ? (
        <Link
          href={seasonHref(next)}
          aria-label={`${next} season`}
          className={arrow}
        >
          <ChevronRight aria-hidden size={18} strokeWidth={2} />
        </Link>
      ) : (
        <span aria-hidden className={cn(arrow, "opacity-30")}>
          <ChevronRight size={18} strokeWidth={2} />
        </span>
      )}
    </div>
  );
};

// The row around the switcher and the cells, shared with the skeleton so
// both are the same height
const SpineRow = ({ children }: { children: ReactNode }) => (
  <div className="border-b border-line bg-surface">
    <div className="mx-auto flex h-[78px] max-w-[1240px] items-stretch gap-3 md:h-20 md:px-6">
      {children}
    </div>
  </div>
);

export const SeasonSpine = async ({
  year: yearParam,
  slug,
}: {
  // From the URL: anything that isn't a season year means the current one
  year?: string;
  slug?: string;
}) => {
  const [now, current] = await Promise.all([
    getRequestTime(),
    getCurrentSeason(),
  ]);
  const year =
    yearParam && isSeasonYear(yearParam) ? Number(yearParam) : current;
  const [races, winners] = await Promise.all([
    getSeasonSchedule(year),
    loadWinners(year),
  ]);

  const states = getRoundStates(races, winners, now);
  const selected = slug
    ? findRaceBySlug(races, decodeURIComponent(slug))?.round
    : undefined;
  // Only the season that's running has a "now"
  const live = year === current;
  const nextSession = live ? findNextSession(races, now) : undefined;

  const rounds: SpineRound[] = states.map(({ race, winner, isNext }) => {
    const { country, locality } = race.Circuit.Location;
    const state = winner ? "done" : live && isNext ? "next" : "future";
    const session =
      nextSession?.race.round === race.round ? nextSession.session : undefined;

    return {
      round: race.round,
      code: getCountryCode3ByName(country),
      href: raceHref(race, races),
      raceName: race.raceName,
      venue: `${race.Circuit.circuitName}, ${locality}`,
      day: formatRaceDay(race),
      sprint: isSprintWeekend(race),
      state,
      label: [
        `Round ${race.round}`,
        country,
        winner
          ? `won by ${winner.Driver.familyName}`
          : state === "next"
            ? "next race"
            : undefined,
      ]
        .filter(Boolean)
        .join(", "),
      winner: winner && {
        name: getDriverName(winner.Driver),
        team: winner.Constructor.name,
        color: getTeamColor(winner.Constructor.constructorId),
        grid: fromGrid(winner.grid),
      },
      nextSession: session && {
        name: session.name,
        start: session.start.toISOString(),
        hasTime: session.hasTime,
      },
    };
  });

  return (
    <SpineRow>
      <SeasonSwitcher year={year} current={current} />
      <nav aria-label="Season rounds" className="flex min-w-0 flex-1">
        {rounds.length ? (
          <SpineTrack
            rounds={rounds}
            selected={selected}
            // The cell to bring into view on phones
            focus={selected ?? rounds.find((r) => r.state === "next")?.round}
          />
        ) : (
          <p className="flex items-center px-4 font-mono text-xs tracking-[0.14em] text-muted uppercase md:px-0">
            The {year} calendar isn&apos;t out yet
          </p>
        )}
      </nav>
    </SpineRow>
  );
};

export const SeasonSpineSkeleton = () => (
  <SpineRow>
    <div className="flex shrink-0 items-center gap-1 border-r border-line pr-3 max-md:hidden">
      <Skeleton className="size-8 bg-transparent" />
      <Skeleton className="h-[26px] w-[60px]" />
      <Skeleton className="size-8 bg-transparent" />
    </div>
    <div
      aria-hidden
      className="flex min-w-0 flex-1 gap-1.5 overflow-hidden px-4 py-2.5 md:gap-[3px] md:px-0 md:py-3"
    >
      {Array.from({ length: 24 }, (_, index) => (
        <Skeleton
          key={index}
          className="w-14 shrink-0 md:w-auto md:min-w-10 md:flex-1"
        />
      ))}
    </div>
  </SpineRow>
);
