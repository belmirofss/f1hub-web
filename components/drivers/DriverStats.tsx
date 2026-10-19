import { StatRail } from "@/components/ui/StatRail";
import {
  getDriverSeasonStanding,
  type Career,
  type CareerSeason,
} from "@/lib/api/jolpica";
import { formatPoints, formerCareerStats, ordinal } from "@/lib/domain/drivers";

// The stat rail: the latest season (position, points, wins, podiums), then
// the whole career (starts, wins, podiums, poles). A former driver's last
// season isn't news, so theirs is the whole career, titles first.
export const DriverStats = async ({
  driverId,
  career,
  latest,
  titles,
}: {
  driverId: string;
  career: Career;
  latest?: CareerSeason;
  titles: number;
}) => {
  if (!career.onGrid)
    return (
      <StatRail
        groups={[{ name: "Career", stats: formerCareerStats(career, titles) }]}
      />
    );

  // Points and wins come from the championship standings: they include
  // sprints, and old seasons only counted a driver's best results
  const standing = latest
    ? await getDriverSeasonStanding(latest.season, driverId)
    : null;
  const position = Number(standing?.position);

  return (
    <StatRail
      groups={[
        ...(latest
          ? [
              {
                name: latest.season,
                raised: true,
                stats: [
                  {
                    label: "Pos",
                    value: position > 0 ? ordinal(position) : "–",
                  },
                  {
                    label: "Pts",
                    value: formatPoints(
                      standing ? Number(standing.points) : latest.points,
                    ),
                  },
                  {
                    label: "Wins",
                    value: standing ? Number(standing.wins) : latest.wins,
                  },
                  { label: "Podiums", value: latest.podiums },
                ],
              },
            ]
          : []),
        {
          name: "Career",
          stats: [
            { label: "Starts", value: career.starts },
            { label: "Wins", value: career.wins },
            { label: "Podiums", value: career.podiums },
            { label: "Poles", value: career.poles },
          ],
        },
      ]}
    />
  );
};
