import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_LIFE, type CacheTier } from "./cacheTiers";
import { fetchJson } from "./fetcher";
import type {
  CarLocation,
  OpenF1Driver,
  OpenF1Lap,
  OpenF1Session,
  RaceControlMessage,
  Stint,
  TeamRadio,
  TrackPoint,
} from "./types";

// OpenF1: tyres, team radio, race control and car positions. Ported from the
// app's useOpenF1.ts.

const OPENF1_API = "https://api.openf1.org/v1/";

// OpenF1 has no data before this season
export const OPENF1_FIRST_SEASON = 2023;

const openF1 = <T>(
  endpoint: string,
  params: Record<string, string | number>,
  tier: CacheTier,
) => {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  return fetchJson<T>(`${OPENF1_API}${endpoint}?${query}`, {
    tier,
    tags: ["openf1"],
  });
};

// A finished session never changes. One still running (or not started) is
// checked again like the current season.
const tierFor = (dateEnd: string): CacheTier =>
  Date.parse(dateEnd) < Date.now() ? "session" : "current";

const cacheFor = (tier: CacheTier) => {
  cacheLife(CACHE_LIFE[tier]);
  cacheTag("openf1");
};

async function loadRaceSessions(year: number): Promise<OpenF1Session[]> {
  "use cache";
  // Sessions get added through the season, so only past years keep long
  const tier = year < new Date().getUTCFullYear() ? "session" : "current";
  cacheFor(tier);
  return openF1<OpenF1Session[]>(
    "sessions",
    { year, session_name: "Race" },
    tier,
  );
}

// OpenF1's Grand Prix session for a race, matched by its date ("2026-10-04")
export const getRaceSession = async (
  season: number | string,
  date: string,
): Promise<OpenF1Session | null> => {
  const year = Number(season);
  if (!(year >= OPENF1_FIRST_SEASON)) return null;
  const sessions = await loadRaceSessions(year);
  return sessions.find((s) => s.date_start.slice(0, 10) === date) ?? null;
};

// What the session functions need from getRaceSession's result
export type SessionRef = Pick<OpenF1Session, "session_key" | "date_end">;

async function loadSessionList<T>(
  endpoint: string,
  sessionKey: number,
  dateEnd: string,
): Promise<T[]> {
  "use cache";
  const tier = tierFor(dateEnd);
  cacheFor(tier);
  return openF1<T[]>(endpoint, { session_key: sessionKey }, tier);
}

const sessionList =
  <T>(endpoint: string) =>
  (session: SessionRef) =>
    loadSessionList<T>(endpoint, session.session_key, session.date_end);

export const getDrivers = sessionList<OpenF1Driver>("drivers");
export const getStints = sessionList<Stint>("stints");
export const getTeamRadio = sessionList<TeamRadio>("team_radio");
export const getRaceControl = sessionList<RaceControlMessage>("race_control");

async function loadTrackOutline(
  sessionKey: number,
  dateEnd: string,
): Promise<TrackPoint[]> {
  "use cache";
  const tier = tierFor(dateEnd);
  cacheFor(tier);

  const laps = await openF1<OpenF1Lap[]>(
    "laps",
    { session_key: sessionKey, lap_number: 5 },
    tier,
  );
  const lap = laps.find(
    (l) =>
      l.date_start &&
      l.lap_duration &&
      l.duration_sector_1 &&
      l.duration_sector_2 &&
      !l.is_pit_out_lap,
  );
  if (!lap?.date_start || !lap.lap_duration) return [];

  const start = Date.parse(lap.date_start);
  const sector2 = start + (lap.duration_sector_1 ?? 0) * 1000;
  const sector3 = sector2 + (lap.duration_sector_2 ?? 0) * 1000;
  const end = start + lap.lap_duration * 1000;

  const locations = await openF1<CarLocation[]>(
    "location",
    {
      session_key: sessionKey,
      driver_number: lap.driver_number,
      "date>": new Date(start).toISOString(),
      "date<": new Date(end).toISOString(),
    },
    tier,
  );

  return locations
    .filter((p) => p.x !== 0 || p.y !== 0)
    .map((p) => {
      const time = Date.parse(p.date);
      return {
        x: p.x,
        y: p.y,
        sector: time < sector2 ? 0 : time < sector3 ? 1 : 2,
      };
    });
}

// Draws the circuit from one car's position samples over a single lap,
// split into sectors with that lap's sector times
export const getTrackOutline = (session: SessionRef) =>
  loadTrackOutline(session.session_key, session.date_end);
