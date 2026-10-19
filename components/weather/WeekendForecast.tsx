import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import type { Forecast, Race } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { HOUR } from "@/lib/domain/time";
import { getSessions } from "@/lib/domain/sessions";
import {
  formatRainChance,
  getCondition,
  getHourAt,
  getHoursBetween,
  getWeekendDays,
} from "@/lib/domain/weather";
import { SessionForecast, type SessionForecastRow } from "./SessionForecast";
import { ConditionIcon, rainClass } from "./Weather";

const round = Math.round;

// Day tiles (in track time) plus the forecast at each session's start
export const WeekendForecast = ({
  race,
  forecast,
}: {
  race: Race;
  forecast: Forecast;
}) => {
  const days = getWeekendDays(race, forecast);
  if (!days.length) return null;

  const rows: SessionForecastRow[] = getSessions(race)
    .filter((session) => session.hasTime)
    .map((session) => {
      const start = session.start.getTime();
      const hour = getHourAt(forecast, start);
      return {
        key: session.key,
        name: session.name,
        start: session.start.toISOString(),
        hour: hour && { ...hour, condition: getCondition(hour.code).label },
        around: getHoursBetween(forecast, start - HOUR, start + 3 * HOUR).map(
          ({ time, rainChance }) => ({ time, rainChance }),
        ),
      };
    });

  return (
    <Card as="section" aria-labelledby="weekend-forecast">
      <div className="flex justify-between gap-3">
        <h2 id="weekend-forecast">
          <Label>Weekend forecast</Label>
        </h2>
        <Label className="text-faint">Open-Meteo</Label>
      </div>
      <ul className="flex gap-2">
        {days.map((day) => (
          <li
            key={day.day}
            className="flex flex-1 flex-col items-center gap-1 bg-surface-raised py-2.5"
          >
            <Label>{day.label}</Label>
            <ConditionIcon
              icon={day.condition.icon}
              className={cn(
                "size-[22px]",
                day.rainChance >= 50 ? "text-rain" : "text-text",
              )}
            />
            <span className="sr-only">{day.condition.label}, </span>
            <span className="font-mono text-sm font-bold">
              <span className="sr-only">high </span>
              {round(day.high)}°{" "}
              <span className="font-medium text-muted">
                <span className="sr-only">low </span>
                {round(day.low)}°
              </span>
            </span>
            <span
              className={cn(
                "font-mono text-[11px] font-bold",
                rainClass(day.rainChance),
              )}
            >
              {formatRainChance(day.rainChance)}
              <span className="sr-only"> chance of rain</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between gap-3 pt-1">
        <h3>
          <Label>Forecast by session</Label>
        </h3>
        <Label aria-hidden>Tap for detail</Label>
      </div>
      <SessionForecast rows={rows} />
    </Card>
  );
};
