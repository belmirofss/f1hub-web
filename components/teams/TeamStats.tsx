import { StatRail } from "@/components/ui/StatRail";
import {
  getChampions,
  getConstructorStandings,
  getConstructorWins,
  getSeasonResults,
} from "@/lib/api/jolpica";
import { formatPoints, ordinal } from "@/lib/domain/drivers";
import { isClassified } from "@/lib/domain/results";

// The stat rail: the latest season (position, points, wins, podiums), then
// all time (constructors' and drivers' titles won with the team, race wins
// and seasons)
export const TeamStats = async ({
  constructorId,
  seasons,
  titles,
}: {
  constructorId: string;
  // Every season the team raced, oldest first
  seasons: string[];
  titles: string[];
}) => {
  const latest = seasons.at(-1);
  const [wins, champions, standings, results] = await Promise.all([
    getConstructorWins(constructorId, seasons),
    getChampions(),
    latest ? getConstructorStandings(latest) : null,
    latest ? getSeasonResults(latest) : [],
  ]);
  const driverTitles = champions.filter(
    (c) => c.teamId === constructorId,
  ).length;

  // The constructors' championship started in 1958, so older seasons count
  // their points and wins from the results
  const standing = standings?.standings.find(
    (s) => s.Constructor.constructorId === constructorId,
  );
  const rows = results.flatMap((race) =>
    (race.Results ?? []).filter(
      (row) => row.Constructor.constructorId === constructorId,
    ),
  );
  const finished = (max: number) =>
    rows.filter((row) => isClassified(row) && Number(row.position) <= max)
      .length;
  const position = Number(standing?.position);

  return (
    <StatRail
      groups={[
        ...(latest
          ? [
              {
                name: latest,
                raised: true,
                stats: [
                  {
                    label: "Pos",
                    value: position > 0 ? ordinal(position) : "–",
                  },
                  {
                    label: "Pts",
                    value: formatPoints(
                      standing
                        ? Number(standing.points)
                        : rows.reduce(
                            (sum, row) => sum + Number(row.points),
                            0,
                          ),
                    ),
                  },
                  {
                    label: "Wins",
                    value: standing ? Number(standing.wins) : finished(1),
                  },
                  { label: "Podiums", value: finished(3) },
                ],
              },
            ]
          : []),
        {
          name: "All-time",
          stats: [
            { label: "Titles", value: titles.length },
            { label: "Driver titles", value: driverTitles },
            { label: "Wins", value: wins },
            { label: "Seasons", value: seasons.length },
          ],
        },
      ]}
    />
  );
};
