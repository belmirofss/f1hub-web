import "server-only";

// How long each kind of data stays cached. Every client function is a
// `use cache` scope with one of these `cacheLife` profiles, and its `fetch`
// calls use the same `revalidate`, so the response also lands in the Data
// Cache, which outlives deploys.

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// `stale` is how long the browser reuses a page, `revalidate` when the server
// refreshes in the background, `expire` how long a stale entry may be served.
export const CACHE_LIFE = {
  // Current season schedule, results and standings
  current: { stale: 5 * MINUTE, revalidate: 10 * MINUTE, expire: DAY },
  // Past seasons never change
  past: { stale: HOUR, revalidate: 30 * DAY, expire: 365 * DAY },
  // Full driver / constructor / circuit lists, careers and profiles
  lists: { stale: HOUR, revalidate: DAY, expire: 7 * DAY },
  // OpenF1 data for sessions that have finished
  session: { stale: HOUR, revalidate: 30 * DAY, expire: 365 * DAY },
  // Open-Meteo forecast
  forecast: { stale: 5 * MINUTE, revalidate: 30 * MINUTE, expire: DAY },
  // Wikipedia summaries
  wikipedia: { stale: HOUR, revalidate: DAY, expire: 7 * DAY },
} as const;

export type CacheTier = keyof typeof CACHE_LIFE;
