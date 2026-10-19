import "server-only";
import { getCircuitHistory } from "@/lib/api/jolpica";
import type { PastWinner } from "@/lib/domain/calendar";
import { getDriverName } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";

// The last three winners at a circuit, newest first, for the calendar's
// round details. An empty list is a new venue; null means the API failed.
export const getLastWinners = async (
  circuitId: string,
): Promise<PastWinner[] | null> => {
  const history = await orFallback(getCircuitHistory(circuitId));
  if (!history) return null;
  return history.races
    .slice(-3)
    .reverse()
    .flatMap((race) => {
      const result = race.Results?.[0];
      return result
        ? [
            {
              season: race.season,
              driver: getDriverName(result.Driver),
              constructorId: result.Constructor.constructorId,
            },
          ]
        : [];
    });
};
