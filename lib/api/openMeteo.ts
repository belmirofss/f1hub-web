import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_LIFE } from "./cacheTiers";
import { fetchJson } from "./fetcher";
import type { Forecast } from "./types";

// Open-Meteo hourly forecast (free, no key). Ported from the app's useWeather.ts.

const OPEN_METEO_API = "https://api.open-meteo.com/v1/";

// Open-Meteo forecasts up to 16 days ahead
export const FORECAST_DAYS = 16;

type Response = {
  hourly: {
    time: string[];
    temperature_2m: number[];
    // Can be null towards the end of the forecast range
    precipitation_probability: (number | null)[];
    precipitation: (number | null)[];
    weather_code: number[];
    wind_speed_10m: number[];
    relative_humidity_2m: number[];
  };
};

// Hourly forecast at the circuit. Check the race is in range first (#6).
export async function getForecast(
  lat: string,
  long: string,
): Promise<Forecast> {
  "use cache";
  cacheLife(CACHE_LIFE.forecast);
  cacheTag("forecast");

  const query = new URLSearchParams({
    latitude: lat,
    longitude: long,
    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "relative_humidity_2m",
    ].join(","),
    forecast_days: String(FORECAST_DAYS),
    timezone: "GMT",
  });
  const { hourly } = await fetchJson<Response>(
    `${OPEN_METEO_API}forecast?${query}`,
    { tier: "forecast", tags: ["forecast"] },
  );

  return {
    // "2026-10-08T14:00" in GMT
    time: hourly.time.map((t) => Date.parse(`${t}Z`)),
    temperature: hourly.temperature_2m,
    rainChance: hourly.precipitation_probability.map((v) => v ?? 0),
    rain: hourly.precipitation.map((v) => v ?? 0),
    code: hourly.weather_code,
    wind: hourly.wind_speed_10m,
    humidity: hourly.relative_humidity_2m,
  };
}
