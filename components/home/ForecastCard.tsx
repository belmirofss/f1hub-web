import { Card, InlineLink } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { LocalTime } from "@/components/time/LocalTime";
import { ConditionIcon, rainClass } from "@/components/weather/Weather";
import { cn } from "@/lib/cn";
import { raceHref } from "@/lib/domain/routes";
import { getSessions, getWeekendStart } from "@/lib/domain/sessions";
import { HOUR } from "@/lib/domain/time";
import {
  FORECAST_DAYS,
  formatRainChance,
  getCondition,
  getHourAt,
  hasForecast,
} from "@/lib/domain/weather";
import { getNextWeekend, getWeekendForecast } from "@/lib/nextWeekend";

// Rain chance and temperature at the start of each session of the next
// weekend, from Open-Meteo. Until the weekend is in range it says when the
// forecast opens.
export const ForecastCard = async () => {
  const { now, races, race } = await getNextWeekend();
  const forecast = race && (await getWeekendForecast(race, now));
  const sessions = race ? getSessions(race).filter((s) => s.hasTime) : [];
  const rows = forecast
    ? sessions.map((session) => ({
        session,
        hour: getHourAt(forecast, session.start.getTime()),
      }))
    : [];

  return (
    <Card as="section" aria-labelledby="forecast" className="gap-1">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 id="forecast">
          <Label>Weekend forecast</Label>
        </h2>
        {race && (
          <InlineLink href={`${raceHref(race, races)}/schedule`}>
            Hour by hour
          </InlineLink>
        )}
      </div>
      {rows.length ? (
        <>
          <ul>
            {rows.map(({ session, hour }) => (
              <li
                key={session.key}
                className="flex min-h-10 items-center gap-2.5 border-t border-line-soft"
              >
                <span
                  className={cn(
                    "flex-1 font-semibold",
                    session.key === "race" && "text-accent-ink",
                  )}
                >
                  {session.name}
                </span>
                {hour ? (
                  <>
                    <ConditionIcon
                      icon={getCondition(hour.code).icon}
                      size={16}
                      className={
                        hour.rainChance >= 50 ? "text-rain" : "text-muted"
                      }
                    />
                    <span className="sr-only">
                      {getCondition(hour.code).label},{" "}
                    </span>
                    <span className="w-9 text-right font-mono text-[13px] text-soft">
                      {Math.round(hour.temperature)}°
                    </span>
                    <span
                      className={cn(
                        "w-11 text-right font-mono text-[13px] font-bold",
                        rainClass(hour.rainChance),
                      )}
                    >
                      {formatRainChance(hour.rainChance)}
                      <span className="sr-only"> chance of rain</span>
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-[11px] text-faint">
                    NOT YET
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="border-t border-line-soft pt-2 font-mono text-[10px] text-muted">
            AT EACH SESSION&apos;S START · OPEN-METEO
          </p>
        </>
      ) : (
        <p className="border-t border-line-soft pt-2.5 text-sm text-soft">
          {race && hasForecast(race, now) ? (
            "The forecast isn't available right now."
          ) : race ? (
            <>
              The forecast for the {race.raceName} opens on{" "}
              <LocalTime
                value={
                  getWeekendStart(race).getTime() -
                  (FORECAST_DAYS - 1) * 24 * HOUR
                }
                format="shortDate"
                className="font-mono font-bold"
              />
              , {FORECAST_DAYS - 1} days before the weekend.
            </>
          ) : (
            "No race weekend ahead this season."
          )}
        </p>
      )}
    </Card>
  );
};

export const ForecastCardSkeleton = () => (
  <CardSkeleton lines={5} className="min-h-[277px]" />
);
