// Ported from the app's src/helpers/weather.ts, plus the weekend summaries
// from its components/Weather.tsx. Icons are names the UI maps to Lucide.
import type { Forecast, Race } from "@/lib/api/types";
import { getCircuitTimezone } from "./circuits";
import { getSessions } from "./sessions";
import { HOUR, formatWeekday, startOfDay } from "./time";

// Open-Meteo forecasts up to 16 days ahead
export const FORECAST_DAYS = 16;

// Only races whose weekend starts within the forecast range and isn't over yet
export const hasForecast = (race: Race | undefined, now: number) => {
  if (!race) return false;
  const sessions = getSessions(race);
  const first = sessions[0]?.start.getTime() ?? 0;
  const last = sessions[sessions.length - 1]?.start.getTime() ?? 0;
  return first - now < (FORECAST_DAYS - 1) * 24 * HOUR && last + 3 * HOUR > now;
};

export type HourForecast = {
  time: number;
  temperature: number;
  rainChance: number;
  rain: number;
  code: number;
  wind: number;
  humidity: number;
};

export const getHour = (forecast: Forecast, index: number): HourForecast => ({
  time: forecast.time[index],
  temperature: forecast.temperature[index],
  rainChance: forecast.rainChance[index],
  rain: forecast.rain[index],
  code: forecast.code[index],
  wind: forecast.wind[index],
  humidity: forecast.humidity[index],
});

// The forecast hour a moment falls in, if the forecast reaches that far
export const getHourAt = (forecast: Forecast, ms: number) => {
  const index = forecast.time.findIndex((t) => ms >= t && ms < t + HOUR);
  return index === -1 ? undefined : getHour(forecast, index);
};

// Hours within [start, end)
export const getHoursBetween = (
  forecast: Forecast,
  start: number,
  end: number,
) =>
  forecast.time.flatMap((t, index) =>
    t >= start && t < end ? [getHour(forecast, index)] : [],
  );

export type ConditionIcon =
  "clear" | "partly-cloudy" | "cloudy" | "rain" | "snow" | "storm";

export type Condition = { label: string; icon: ConditionIcon };

// WMO weather interpretation codes, as used by Open-Meteo
export const getCondition = (code: number): Condition => {
  if (code === 0) return { label: "Clear", icon: "clear" };
  if (code <= 2) return { label: "Partly cloudy", icon: "partly-cloudy" };
  if (code === 3) return { label: "Overcast", icon: "cloudy" };
  if (code <= 48) return { label: "Fog", icon: "cloudy" };
  if (code <= 57) return { label: "Drizzle", icon: "rain" };
  if (code <= 67) return { label: "Rain", icon: "rain" };
  if (code <= 77) return { label: "Snow", icon: "snow" };
  if (code <= 82) return { label: "Showers", icon: "rain" };
  if (code <= 86) return { label: "Snow showers", icon: "snow" };
  return { label: "Thunderstorms", icon: "storm" };
};

// Worst weather of a set of hours, so a stormy afternoon isn't hidden by a sunny morning
export const getWorstCode = (hours: HourForecast[]) =>
  hours.reduce((worst, hour) => Math.max(worst, hour.code), 0);

export const formatRainChance = (chance: number) => `${Math.round(chance)}%`;

// "0.4", for the rain-in-mm stat
export const formatRain = (mm: number) => mm.toFixed(1);

// How likely rain is, in the app's three steps
export type RainLevel = "dry" | "possible" | "likely";

export const getRainLevel = (chance: number): RainLevel =>
  chance >= 50 ? "likely" : chance >= 30 ? "possible" : "dry";

// Every forecast hour from the first session's day to two hours after the race.
// The day starts at midnight in `timeZone` (the viewer's when left out).
export const getWeekendHours = (
  race: Race,
  forecast: Forecast,
  timeZone?: string,
) => {
  const sessions = getSessions(race);
  if (!sessions.length) return [];
  const start = startOfDay(sessions[0].start, timeZone);
  const end = sessions[sessions.length - 1].start.getTime() + 2 * HOUR;
  return getHoursBetween(forecast, start, end);
};

export type WeatherSummary = {
  headline: string;
  rainChance: number;
  low: number;
  high: number;
  wind: number;
  condition: Condition;
};

// "Dry all weekend · 25–29°C · wind 14 km/h" for the Home next-race card
export const getWeatherSummary = (
  race: Race,
  forecast: Forecast,
  timeZone?: string,
): WeatherSummary | undefined => {
  const hours = getWeekendHours(race, forecast, timeZone);
  if (!hours.length) return undefined;

  const rainChance = Math.max(...hours.map((h) => h.rainChance));
  const temps = hours.map((h) => h.temperature);
  return {
    headline:
      rainChance < 20
        ? "Dry all weekend"
        : rainChance >= 50
          ? "Rain likely"
          : "Chance of rain",
    rainChance,
    low: Math.min(...temps),
    high: Math.max(...temps),
    wind: Math.max(...hours.map((h) => h.wind)),
    condition: getCondition(getWorstCode(hours)),
  };
};

export type DayForecast = {
  day: number; // midnight at the track
  label: string; // "FRI"
  high: number;
  low: number;
  rainChance: number;
  condition: Condition;
};

// Day-by-day outlook for the days with timed sessions, in track time
export const getWeekendDays = (
  race: Race,
  forecast: Forecast,
): DayForecast[] => {
  const timeZone = getCircuitTimezone(race.Circuit.circuitId);
  const days = new Set(
    getSessions(race)
      .filter((s) => s.hasTime)
      .map((s) => startOfDay(s.start, timeZone)),
  );
  return [...days].flatMap((day) => {
    const hours = getHoursBetween(forecast, day, day + 24 * HOUR);
    if (!hours.length) return [];
    return [
      {
        day,
        label: formatWeekday(day, timeZone),
        high: Math.max(...hours.map((h) => h.temperature)),
        low: Math.min(...hours.map((h) => h.temperature)),
        rainChance: Math.max(...hours.map((h) => h.rainChance)),
        condition: getCondition(getWorstCode(hours)),
      },
    ];
  });
};
