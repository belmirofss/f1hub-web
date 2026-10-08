import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_LIFE } from "./cacheTiers";
import { fetchJson } from "./fetcher";
import { FORECAST_DAYS, hasForecast } from "@/lib/domain/weather";
import type { Forecast, Race } from "./types";

// Open-Meteo hourly forecast (free, no key). Ported from the app's useWeather.ts.

const OPEN_METEO_API = "https://api.open-meteo.com/v1/";

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

// Hourly forecast at the circuit. Check `hasForecast` first.
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

// A race weekend's forecast, or null while the weekend is out of range or
// once it's over. The date is checked inside the cache, so the forecast is
// part of the prerendered page and refreshes with it.
export async function getRaceForecast(race: Race): Promise<Forecast | null> {
  "use cache";
  cacheLife(CACHE_LIFE.forecast);
  cacheTag("forecast");

  if (!hasForecast(race, Date.now())) return null;
  const { lat, long } = race.Circuit.Location;
  return getForecast(lat, long);
}
