import "server-only";
import { CACHE_LIFE, type CacheTier } from "./cacheTiers";

// Ported from the app's src/api.ts (axios interceptors) onto Next's `fetch`.

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number, // 0 = network error
    readonly url: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Queue = { acquire: () => Promise<void>; release: () => void };

// Lets a few requests run at once and spaces out their starts, so pages that
// fire many requests together stay under the APIs' rate limits. The queue
// lives in the server instance's memory, so each instance throttles itself.
const createQueue = (concurrent: number, gapMs: number): Queue => {
  let active = 0;
  let lastStart = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const waiting: (() => void)[] = [];

  const next = () => {
    if (timer || active >= concurrent || !waiting.length) return;
    const wait = lastStart + gapMs - Date.now();
    if (wait > 0) {
      timer = setTimeout(() => {
        timer = undefined;
        next();
      }, wait);
      return;
    }
    active++;
    lastStart = Date.now();
    waiting.shift()!();
    next();
  };

  return {
    acquire: () =>
      new Promise<void>((resolve) => {
        waiting.push(resolve);
        next();
      }),
    release: () => {
      active--;
      next();
    },
  };
};

const QUEUES: Record<string, Queue> = {
  // Jolpica: 4 requests a second, 500 an hour. Starting 3 a second leaves
  // room for network jitter on long runs like a race's 13 pages of laps.
  "api.jolpi.ca": createQueue(3, 340),
  // OpenF1 free tier: 3 requests a second, 30 a minute
  "api.openf1.org": createQueue(1, 400),
};

const MAX_RETRIES = 3;
// A longer Retry-After means the hourly quota is spent: fail instead of
// holding the render open
const MAX_RETRY_AFTER_MS = 30_000;

type FetchJsonOptions = {
  tier: CacheTier;
  tags?: string[];
  headers?: HeadersInit;
};

// GETs JSON through the Data Cache. Queued per API host and retried up to 3
// times when rate limited (429).
export async function fetchJson<T>(
  url: string,
  { tier, tags, headers }: FetchJsonOptions,
): Promise<T> {
  const queue = QUEUES[new URL(url).host];

  for (let attempt = 0; ; attempt++) {
    await queue?.acquire();
    let response: Response;
    let body: unknown;
    try {
      response = await fetch(url, {
        headers,
        next: { revalidate: CACHE_LIFE[tier].revalidate, tags },
      });
      body = response.ok ? await response.json() : undefined;
    } catch (error) {
      throw new ApiError(
        `Request failed: ${error instanceof Error ? error.message : error}`,
        0,
        url,
      );
    } finally {
      queue?.release();
    }

    if (response.ok) return body as T;

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(response.headers.get("retry-after")) * 1000;
      const wait = retryAfter > 0 ? retryAfter : 1500 * (attempt + 1);
      if (wait <= MAX_RETRY_AFTER_MS) {
        await sleep(wait);
        continue;
      }
    }
    throw new ApiError(
      `${response.status} ${response.statusText}`,
      response.status,
      url,
    );
  }
}
