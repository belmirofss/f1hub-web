import { connection } from "next/server";
import { getLastWinners } from "@/lib/circuitWinners";

const DAY = 24 * 60 * 60;

// A circuit's last three winners, for a round the calendar picks in the
// browser: the page only brings the selected round's. Cached like the
// circuit lists, a day on the CDN, so most picks never reach the server.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/circuits/[circuitId]/winners">,
) {
  await connection();
  const { circuitId } = await params;
  if (!/^[a-z0-9_]{1,40}$/.test(circuitId))
    return Response.json({ error: "Unknown circuit" }, { status: 404 });

  const winners = await getLastWinners(circuitId);
  if (!winners)
    return Response.json(
      { error: "Couldn't load the winners" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  return Response.json(winners, {
    headers: {
      "Cache-Control": `public, max-age=3600, s-maxage=${DAY}, stale-while-revalidate=${7 * DAY}`,
    },
  });
}
