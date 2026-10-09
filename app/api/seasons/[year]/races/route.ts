import { connection } from "next/server";
import { getCurrentSeason } from "@/lib/api/jolpica";
import { getYearRaces } from "@/lib/searchIndex";

const DAY = 24 * 60 * 60;

// One season's schedule for "monaco 2024" style searches. Built at request
// time like the search index; a finished season's schedule never changes, so
// the CDN keeps it a month, and the current one ten minutes.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/seasons/[year]/races">,
) {
  await connection();
  const { year } = await params;
  const races = await getYearRaces(year);
  if (!races)
    return Response.json({ error: "Unknown season" }, { status: 404 });

  const finished = Number(year) < (await getCurrentSeason());
  return Response.json(races, {
    headers: {
      "Cache-Control": finished
        ? `public, max-age=${DAY}, s-maxage=${30 * DAY}, stale-while-revalidate=${30 * DAY}`
        : `public, max-age=600, s-maxage=600, stale-while-revalidate=${DAY}`,
    },
  });
}
