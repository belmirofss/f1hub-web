import "server-only";
import { getDriverStandings, getSeasonResults } from "@/lib/api/jolpica";
import { getTeammatePairs } from "@/lib/domain/headToHead";

// A team's two main drivers in a season, paired the same way as on the
// Teammates pages, or undefined when it ran fewer than two. Every call is
// cached, so the points chart and the teammate link can both ask.
export const getTeamPair = async (season: string, constructorId: string) => {
  const [results, standings] = await Promise.all([
    getSeasonResults(season),
    getDriverStandings(season),
  ]);
  // Qualifying doesn't change who the pair is
  const pair = getTeammatePairs(results, [], standings?.standings ?? []).find(
    (p) => p.team.constructorId === constructorId,
  );
  return { pair, results };
};
