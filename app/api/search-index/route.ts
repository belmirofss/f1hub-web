import { connection } from "next/server";
import { getSearchIndex } from "@/lib/searchIndex";

const DAY = 24 * 60 * 60;

// Every driver, team, circuit and season plus the current season's races and
// grid, for /search. Built at request time so the build doesn't depend on
// the API; the index is cached daily and the CDN keeps the response a day.
export async function GET() {
  await connection();
  return Response.json(await getSearchIndex(), {
    headers: {
      "Cache-Control": `public, max-age=3600, s-maxage=${DAY}, stale-while-revalidate=${7 * DAY}`,
    },
  });
}
