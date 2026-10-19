import "server-only";
import { getSeasonSchedule } from "@/lib/api/jolpica";
import { getForecast } from "@/lib/api/openMeteo";
import type { Race } from "@/lib/api/types";
import { findWeekendRace } from "@/lib/domain/sessions";
import { hasForecast } from "@/lib/domain/weather";
import { getRequestTime } from "@/lib/requestTime";

// The race weekend Home is about, shared by the hero and the cards around it.
// Every call is cached, so each card can ask again. No race means the season
// is over.
export const getNextWeekend = async () => {
  const now = await getRequestTime();
  const races = await getSeasonSchedule("current");
  const race = findWeekendRace(races, now);
  return { now, races, race };
};

// The weather is extra: if Open-Meteo is down the cards still show, and it's
// undefined until the weekend is in the forecast's range
export const getWeekendForecast = async (race: Race, now: number) => {
  if (!hasForecast(race, now)) return undefined;
  try {
    const { lat, long } = race.Circuit.Location;
    return await getForecast(lat, long);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
