import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/StatGrid";
import {
  getDriverSeasonStanding,
  type Career,
  type CareerSeason,
} from "@/lib/api/jolpica";
import { formatPoints, ordinal, shortYear } from "@/lib/domain/drivers";

// "2008 World Champion" or "7× World Champion   '08 '14 '15 '17 '18 '19 '20"
export const TitlesCard = ({ titles }: { titles: string[] }) => {
  if (!titles.length) return null;

  return (
    <Card className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5 rounded-[10px] px-3 py-2.5">
      <Trophy
        aria-hidden
        size={18}
        strokeWidth={2}
        className="shrink-0 text-accent"
      />
      <p className="text-sm font-bold whitespace-nowrap">
        {titles.length === 1
          ? `${titles[0]} World Champion`
          : `${titles.length}× World Champion`}
      </p>
      {titles.length > 1 && (
        // Wraps under the title when the years don't fit beside it
        <p className="ml-auto font-mono text-[11px] text-muted">
          <span className="sr-only">{titles.join(", ")}</span>
          <span aria-hidden>{titles.map(shortYear).join(" ")}</span>
        </p>
      )}
    </Card>
  );
};

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
