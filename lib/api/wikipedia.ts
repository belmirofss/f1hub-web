import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_LIFE } from "./cacheTiers";
import { ApiError, fetchJson } from "./fetcher";

// Wikipedia REST summaries for bios. Ported from the app's useWikipediaSummary.ts.

const WIKIPEDIA_SUMMARY_API =
  "https://en.wikipedia.org/api/rest_v1/page/summary/";

// Wikimedia asks API clients to identify themselves
const USER_AGENT = "F1HUB-web (https://github.com/belmirofss/f1hub-web)";

async function loadSummary(title: string): Promise<string | null> {
  "use cache";
  cacheLife(CACHE_LIFE.wikipedia);
  cacheTag("wikipedia");
  try {
    const data = await fetchJson<{ extract?: string }>(
      `${WIKIPEDIA_SUMMARY_API}${encodeURIComponent(title)}`,
      {
        tier: "wikipedia",
        tags: ["wikipedia"],
        headers: { "User-Agent": USER_AGENT },
      },
    );
    return data.extract || null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// Takes the Wikipedia link the F1 API gives ("http://en.wikipedia.org/wiki/Lando_Norris")
export const getWikipediaSummary = async (url: string) => {
  const title = url.split("/wiki/")[1];
  return title ? loadSummary(decodeURIComponent(title)) : null;
};
