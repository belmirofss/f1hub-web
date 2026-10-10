import "server-only";
import { cache } from "react";
import { getCurrentSeason, getSeasonWinners } from "@/lib/api/jolpica";
import {
  OPENF1_FIRST_SEASON,
  getRaceSession,
  getTrackOutline,
} from "@/lib/api/openf1";
import type { RaceResults } from "@/lib/api/types";
import { PLACEHOLDER_OUTLINE, type TrackOutline } from "@/lib/domain/trackMap";
import { orFallback } from "@/lib/metadata";

// The latest race OpenF1 covers at each circuit, from the winners of every
// season since its first: a handful of cached requests, where each circuit's
// own history would be two per circuit. Once per render.
const getLatestRaces = cache(async () => {
  const current = await getCurrentSeason();
  const seasons = Array.from(
    { length: current - OPENF1_FIRST_SEASON + 1 },
    (_, index) => OPENF1_FIRST_SEASON + index,
  );
  const lists = await Promise.all(
    seasons.map((season) => orFallback(getSeasonWinners(season))),
  );
  // Oldest first, so later races replace earlier ones
  const latest = new Map<string, RaceResults>();
  lists.flat().forEach((race) => {
    if (race) latest.set(race.Circuit.circuitId, race);
  });
  return latest;
});

// A thumbnail outline of a circuit, drawn from the winner's fastest lap of
// the latest race there. Circuits OpenF1 has nothing for (new venues) get
// the placeholder loop, and so do failed requests (OpenF1 shuts its free
// API during live sessions), which aren't cached, so the next visit tries
// again.
export const getCircuitOutline = async (
  circuitId: string,
): Promise<TrackOutline> => {
  const race = (await getLatestRaces()).get(circuitId);
  const winner = race?.Results?.[0];
  if (!race || !winner) return PLACEHOLDER_OUTLINE;
  const session = await orFallback(getRaceSession(race.season, race.date));
  const outline =
    session &&
    (await orFallback(getTrackOutline(session, Number(winner.number))));
  return outline ?? PLACEHOLDER_OUTLINE;
};
