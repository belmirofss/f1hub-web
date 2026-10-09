import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/StatGrid";
import {
  getDriverSeasonStanding,
  type Career,
  type CareerSeason,
} from "@/lib/api/jolpica";
import { formatPoints, ordinal } from "@/lib/domain/drivers";

// The latest season (position, points, wins, podiums) over the whole career
// (starts, wins, podiums, poles)
export const StatsCard = async ({
  driverId,
  career,
  latest,
}: {
  driverId: string;
  career: Career;
  latest?: CareerSeason;
}) => {
  // Points and wins come from the championship standings: they include
  // sprints, and old seasons only counted a driver's best results
  const standing = latest
    ? await getDriverSeasonStanding(latest.season, driverId)
    : null;
  const position = Number(standing?.position);

  return (
    <Card as="section" aria-label="Season and career stats">
      {latest && (
        <>
          <h2>
            <Label>{latest.season} season</Label>
          </h2>
          <StatGrid
            stats={[
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
            ]}
          />
          <div className="h-px bg-line-soft" />
        </>
      )}
      <h2>
        <Label>Career</Label>
      </h2>
      <StatGrid
        stats={[
          { label: "Starts", value: career.starts },
          { label: "Wins", value: career.wins },
          { label: "Podiums", value: career.podiums },
          { label: "Poles", value: career.poles },
        ]}
      />
    </Card>
  );
};

export const StatsCardSkeleton = () => (
  <CardSkeleton lines={3} className="min-h-[190px]" />
);
