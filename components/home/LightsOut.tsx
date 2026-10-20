import Link from "next/link";
import { ChevronRight, Map as MapIcon } from "lucide-react";
import { LocalTime, TrackTime } from "@/components/time/LocalTime";
import {
  SessionTime,
  TimeZoneModeProvider,
  TimeZoneToggle,
} from "@/components/time/TimeZoneMode";
import { TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { LinkPending } from "@/components/ui/LinkPending";
import { Skeleton } from "@/components/ui/Skeleton";
import { WeatherSummary, rainClass } from "@/components/weather/Weather";
import { getConstructorStandings, getDriverStandings } from "@/lib/api/jolpica";
import type { Forecast } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getCircuitTimezone } from "@/lib/domain/circuits";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import {
  circuitHref,
  driverHref,
  raceHref,
  seasonHref,
  teamHref,
} from "@/lib/domain/routes";
import {
  getRaceStart,
  getSessionEnd,
  getSessions,
  getWeekendStart,
  isDayOver,
  isSprintWeekend,
  untimedLabel,
  type Session,
  type SessionKey,
} from "@/lib/domain/sessions";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";
import {
  formatRainChance,
  getHourAt,
  getWeatherSummary,
} from "@/lib/domain/weather";
import { getNextWeekend, getWeekendForecast } from "@/lib/nextWeekend";
import {
  StartLights,
  WeekendCountdown,
  WeekendLabel,
  WeekendTimeline,
  type WeekendSession,
} from "./WeekendClock";

const button =
  "relative flex min-h-11 items-center gap-2 rounded-md bg-surface-raised px-3 text-sm font-semibold transition-colors hover:bg-line lg:px-3.5";

// Under each start-light pod and above each timeline block
const CODES: Record<SessionKey, string> = {
  fp1: "FP1",
  fp2: "FP2",
  fp3: "FP3",
  sprintQualifying: "SQ",
  sprint: "SPR",
  qualifying: "Q",
  race: "RACE",
};

const SessionRow = ({
  session,
  forecast,
  now,
}: {
  session: Session;
  forecast?: Forecast;
  now: number;
}) => {
  const isRace = session.key === "race";
  const hour = forecast && getHourAt(forecast, session.start.getTime());

  return (
    <li className="flex min-h-10 items-center border-t border-line lg:min-h-[42px]">
      <span className="w-16 font-mono text-xs text-muted lg:w-[72px]">
        {session.hasTime ? (
          <SessionTime value={session.start} format="day" />
        ) : (
          // Only the date is known, and the API gives it in UTC
          <TrackTime value={session.start} format="day" timeZone="UTC" />
        )}
      </span>
      <span className={cn("flex-1 font-semibold", isRace && "text-accent-ink")}>
        {session.name}
      </span>
      {hour && (
        <span className="mr-3 font-mono text-xs text-muted lg:mr-4">
          {Math.round(hour.temperature)}°
          <span className="max-lg:hidden">
            {" · "}
            <span className={rainClass(hour.rainChance)}>
              {formatRainChance(hour.rainChance)}
            </span>
            <span className="sr-only"> chance of rain</span>
          </span>
        </span>
      )}
      <span className={cn("font-mono font-bold", isRace && "text-accent-ink")}>
        {session.hasTime ? (
          <SessionTime value={session.start} format="clock" />
        ) : (
          untimedLabel(isDayOver(session, now))
        )}
      </span>
    </li>
  );
};

// Instead of the hero once the last race is run: the drivers' champion, and
// the constructors' one beside them
const SeasonComplete = async () => {
  const [drivers, constructors] = await Promise.all([
    getDriverStandings("current"),
    getConstructorStandings("current"),
  ]);
  const champion = drivers?.standings[0];
  const team = constructors?.standings[0];
  const season = drivers?.season;

  return (
    <section
      aria-labelledby="weekend-race"
      className="flex flex-col gap-4 border-t-2 border-text pt-3 lg:gap-5"
    >
      <Label className="text-accent-ink">
        Season complete{season && ` · ${season} champions`}
      </Label>
      {champion ? (
        <Link
          href={driverHref(champion.Driver.driverId)}
          className="group flex items-center gap-3 lg:gap-4"
        >
          <TeamBar
            color={getTeamColor(champion.Constructors.at(-1)?.constructorId)}
            className="h-16! lg:h-24!"
          />
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-sm text-muted">Drivers&apos; champion</span>
            <h2
              id="weekend-race"
              className="display-title text-[40px] leading-[0.9] font-black group-hover:underline lg:text-[84px]"
            >
              {getDriverName(champion.Driver)}
            </h2>
            <span className="font-mono text-sm text-soft">
              {champion.points} PTS · {champion.wins}{" "}
              {champion.wins === "1" ? "WIN" : "WINS"}
            </span>
          </span>
        </Link>
      ) : (
        <h2 id="weekend-race" className="page-title">
          No more races this season
        </h2>
      )}
      {team && (
        <Link
          href={teamHref(team.Constructor.constructorId)}
          className="group flex items-center gap-2.5"
        >
          <TeamBar color={getTeamColor(team.Constructor.constructorId)} />
          <span className="text-sm text-muted">
            Constructors&apos; champion
          </span>
          <span className="font-bold group-hover:underline">
            {team.Constructor.name}
          </span>
          <span className="font-mono text-sm text-soft">{team.points} PTS</span>
        </Link>
      )}
      <div className="flex flex-wrap gap-2">
        {season && (
          <Link
            href={seasonHref(season)}
            className={cn(button, "justify-between")}
          >
            {season} season review
            <ChevronRight aria-hidden size={16} strokeWidth={2} />
          </Link>
        )}
        <Link href="/archive" className={cn(button, "justify-between")}>
          Archive
          <ChevronRight aria-hidden size={16} strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
};

// Home's hero, "Lights Out": a start light per session that comes on as the
// session ends, the next session's countdown, the weekend on a timeline and
// the session list with times and temperatures
export const LightsOut = async () => {
  const { now, races, race } = await getNextWeekend();
  if (!race) return <SeasonComplete />;

  const sessions = getSessions(race);
  const trackTimeZone = getCircuitTimezone(race.Circuit.circuitId);
  const forecast = await getWeekendForecast(race, now);
  const weather =
    forecast && getWeatherSummary(race, forecast, trackTimeZone ?? "UTC");
  const href = raceHref(race, races);
  const { locality, country } = race.Circuit.Location;
  const clock = {
    serverNow: now,
    sessions: sessions.map((session): WeekendSession => ({
      key: session.key,
      name: session.name,
      code: CODES[session.key],
      start: session.start.getTime(),
      end: getSessionEnd(session),
    })),
  };

  return (
    <section
      aria-labelledby="weekend-race"
      className="flex flex-col gap-5 lg:gap-7"
    >
      <TimeZoneModeProvider trackTimeZone={trackTimeZone}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="flex min-w-0 flex-col gap-3.5 lg:gap-[18px]">
            <StartLights {...clock} />
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <WeekendLabel {...clock} round={race.round} />
              {isSprintWeekend(race) && (
                <span className="bg-sprint px-1.5 py-0.5 font-mono text-[11px] font-bold text-text">
                  SPRINT
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <h2
                id="weekend-race"
                className="display-title text-[40px] leading-[0.9] font-black text-balance lg:text-[84px] lg:leading-[0.88]"
              >
                {race.raceName}
              </h2>
              <p className="text-sm text-muted lg:text-[15px]">
                {race.Circuit.circuitName} · {getCountryCode3ByName(country)}
                {" · "}
                <LocalTime
                  value={getWeekendStart(race)}
                  end={getRaceStart(race)}
                  format="range"
                />
              </p>
            </div>
          </div>
          <WeekendCountdown {...clock} />
        </div>

        {sessions.length > 1 && sessions.every((s) => s.hasTime) && (
          <WeekendTimeline {...clock} />
        )}

        {/* Phones stack weather, sessions, buttons; desktop puts the sessions
            on the left and weather + buttons on the right */}
        <div className="flex flex-col gap-3.5 lg:flex-row lg:flex-wrap lg:gap-5">
          <div className="order-2 min-w-0 lg:order-none lg:flex-[3_1_360px]">
            <div className="mb-1.5 flex min-h-[30px] items-center justify-between gap-3">
              <h3>
                <Label className="font-bold">Sessions</Label>
              </h3>
              <TimeZoneToggle />
            </div>
            <ul>
              {sessions.map((session) => (
                <SessionRow
                  key={session.key}
                  session={session}
                  forecast={forecast}
                  now={now}
                />
              ))}
            </ul>
          </div>

          <div className="contents lg:flex lg:min-w-0 lg:flex-[2_1_240px] lg:flex-col lg:gap-2.5">
            {weather && (
              <WeatherSummary
                summary={weather}
                className="order-1 lg:order-none"
              />
            )}
            <div className="order-3 flex gap-2 lg:order-none lg:flex-col">
              <Link
                href={`${href}/schedule`}
                className={cn(button, "flex-1 justify-between lg:flex-none")}
              >
                Weekend details
                <ChevronRight aria-hidden size={16} strokeWidth={2} />
                <LinkPending />
              </Link>
              <Link
                href={circuitHref(race.Circuit.circuitId)}
                className={cn(button, "lg:justify-between")}
              >
                <MapIcon
                  aria-hidden
                  size={16}
                  strokeWidth={2}
                  className="lg:order-last"
                />
                <span className="lg:hidden">Circuit</span>
                <span className="max-lg:hidden">{locality} circuit guide</span>
                <LinkPending />
              </Link>
            </div>
          </div>
        </div>
      </TimeZoneModeProvider>
    </section>
  );
};

// The hero's outline at its usual size, so the cards under it don't move
// when it arrives
export const LightsOutSkeleton = () => (
  <div
    aria-hidden
    className="flex min-h-[778px] flex-col gap-5 md:min-h-[802px] lg:min-h-[681px] lg:gap-7"
  >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
      <div className="flex flex-col gap-3.5 lg:gap-[18px]">
        <div className="flex gap-2 lg:gap-3.5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-[79px] flex-1 md:max-w-[58px] lg:h-[106px] lg:w-[58px] lg:flex-none"
            />
          ))}
        </div>
        <Skeleton className="h-3.5 w-52" />
        <Skeleton className="h-[72px] w-4/5 lg:h-[74px] lg:w-[560px]" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <Skeleton className="h-[88px] w-[250px] lg:h-[130px] lg:w-[380px]" />
    </div>
    <Skeleton className="h-[52px] md:h-[104px]" />
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-[30px] w-40" />
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-[34px]" />
      ))}
    </div>
  </div>
);
