import Link from "next/link";
import { ChevronRight, Map as MapIcon } from "lucide-react";
import { Countdown } from "@/components/time/Countdown";
import { LocalTime, TrackTime } from "@/components/time/LocalTime";
import {
  SessionTime,
  TimeZoneModeProvider,
  TimeZoneToggle,
} from "@/components/time/TimeZoneMode";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { WeatherSummary, rainClass } from "@/components/weather/Weather";
import { getSeasonSchedule } from "@/lib/api/jolpica";
import { getForecast } from "@/lib/api/openMeteo";
import type { Forecast, Race } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getCircuitTimezone } from "@/lib/domain/circuits";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import { circuitHref, raceHref } from "@/lib/domain/routes";
import {
  findNextRace,
  getRaceStart,
  getSessions,
  getWeekendStart,
  isSprintWeekend,
  type Session,
} from "@/lib/domain/sessions";
import {
  formatRainChance,
  getHourAt,
  getWeatherSummary,
  hasForecast,
} from "@/lib/domain/weather";
import { getRequestTime } from "@/lib/requestTime";

const button =
  "flex min-h-11 items-center gap-2 rounded-md bg-surface-raised px-3 text-sm font-semibold transition-colors hover:bg-line lg:px-3.5";

// The weather is extra: if Open-Meteo is down the card still shows
const loadForecast = async (race: Race) => {
  try {
    const { lat, long } = race.Circuit.Location;
    return await getForecast(lat, long);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

const SessionRow = ({
  session,
  forecast,
}: {
  session: Session;
  forecast?: Forecast;
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
      <span className={cn("flex-1 font-semibold", isRace && "text-accent")}>
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
      <span className={cn("font-mono font-bold", isRace && "text-accent")}>
        {session.hasTime ? (
          <SessionTime value={session.start} format="clock" />
        ) : (
          "TBC"
        )}
      </span>
    </li>
  );
};

const SeasonComplete = () => (
  <Card as="section" aria-labelledby="next-race">
    <Label>Season complete</Label>
    <h2 id="next-race" className="text-xl font-bold">
      No more races this season
    </h2>
    <p className="text-muted">
      Relive the season in the{" "}
      <Link href="/archive" className="font-semibold text-text underline">
        Archive
      </Link>{" "}
      while the next calendar is announced.
    </p>
  </Card>
);

export const NextRaceCard = async () => {
  const now = await getRequestTime();
  const races = await getSeasonSchedule("current");
  const race = findNextRace(races, now);
  if (!race) return <SeasonComplete />;

  const sessions = getSessions(race);
  const trackTimeZone = getCircuitTimezone(race.Circuit.circuitId);
  const forecast = hasForecast(race, now)
    ? await loadForecast(race)
    : undefined;
  const weather =
    forecast && getWeatherSummary(race, forecast, trackTimeZone ?? "UTC");
  const href = raceHref(race, races);
  const { locality, country } = race.Circuit.Location;

  return (
    <Card as="section" aria-labelledby="next-race" className="gap-3.5 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <Label>
          Next race · R{race.round}/{races.length}
        </Label>
        {isSprintWeekend(race) && (
          <span className="rounded-[3px] bg-sprint px-1.5 py-0.5 font-mono text-[11px] font-bold text-background">
            SPRINT
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3.5">
        <div className="min-w-0">
          <h2
            id="next-race"
            className="text-[26px] leading-[30px] font-bold lg:-skew-x-6 lg:text-[40px] lg:leading-[44px] lg:font-black"
          >
            {race.raceName}
          </h2>
          <p className="text-sm text-muted lg:text-[15px]">
            {race.Circuit.circuitName} · {getCountryCode3ByName(country)}
            <span className="max-lg:hidden">
              {" · "}
              <LocalTime
                value={getWeekendStart(race)}
                end={getRaceStart(race)}
                format="range"
              />
            </span>
          </p>
        </div>
        <Countdown
          target={getRaceStart(race)}
          className="w-full lg:w-auto"
          cellClassName="lg:w-[84px] lg:flex-none"
          valueClassName="lg:text-[38px]/[42px]"
        />
      </div>

      {/* Phones stack weather, sessions, buttons; desktop puts the sessions
          on the left and weather + buttons on the right */}
      <div className="flex flex-col gap-3.5 lg:flex-row lg:flex-wrap lg:gap-5">
        <TimeZoneModeProvider trackTimeZone={trackTimeZone}>
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
                />
              ))}
            </ul>
          </div>
        </TimeZoneModeProvider>

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
              className={cn(button, "flex-1 justify-between")}
            >
              Weekend details
              <ChevronRight aria-hidden size={16} strokeWidth={2} />
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
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const NextRaceCardSkeleton = () => (
  <CardSkeleton lines={8} className="min-h-[520px] lg:min-h-[400px] lg:p-5" />
);
