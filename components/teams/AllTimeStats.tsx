import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatGrid } from "@/components/ui/StatGrid";
import { getChampions, getConstructorWins } from "@/lib/api/jolpica";

// Constructors' and drivers' titles won with the team, race wins and seasons
export const AllTimeStats = async ({
  constructorId,
  seasons,
  titles,
}: {
  constructorId: string;
  seasons: string[];
  titles: string[];
}) => {
  const [wins, champions] = await Promise.all([
    getConstructorWins(constructorId, seasons),
    getChampions(),
  ]);
  const driverTitles = champions.filter(
    (c) => c.teamId === constructorId,
  ).length;

  return (
    <Card as="section" aria-labelledby="all-time">
      <h2 id="all-time">
        <Label>All time</Label>
      </h2>
      <StatGrid
        stats={[
          { label: "Team titles", value: titles.length },
          { label: "Driver titles", value: driverTitles },
          { label: "Wins", value: wins },
          { label: "Seasons", value: seasons.length },
        ]}
      />
    </Card>
  );
};

export const AllTimeStatsSkeleton = () => (
  <CardSkeleton lines={1} className="min-h-[106px]" />
);
