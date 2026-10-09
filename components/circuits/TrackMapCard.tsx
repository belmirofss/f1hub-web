import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getRaceSession, getTrackMap } from "@/lib/api/openf1";
import type { RaceResults } from "@/lib/api/types";
import { cn } from "@/lib/cn";

const SECTORS = [
  { name: "Sector 1", stroke: "stroke-rain", fill: "bg-rain" },
  { name: "Sector 2", stroke: "stroke-sprint", fill: "bg-sprint" },
  { name: "Sector 3", stroke: "stroke-purple", fill: "bg-purple" },
];

const LINE = {
  fill: "none",
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const;

// The circuit drawn from the winner's fastest lap of a race OpenF1 has data
// for, coloured by sector. Disappears when OpenF1 has nothing for it.
export const TrackMapCard = async ({
  race,
  circuitName,
}: {
  race: RaceResults;
  circuitName: string;
}) => {
  const winner = race.Results?.[0];
  const session = await getRaceSession(race.season, race.date);
  if (!winner || !session) return null;
  const map = await getTrackMap(session, Number(winner.number));
  if (!map) return null;

  return (
    <Card as="section" aria-labelledby="track-map" className="p-3">
      <h2 id="track-map" className="pl-1">
        <Label>Track map · {race.season} layout</Label>
      </h2>
      <svg
        viewBox={`0 0 ${map.width} ${map.height}`}
        role="img"
        aria-label={`${circuitName} outline, split into three sectors`}
        className="mx-auto block h-auto max-h-[360px] w-full"
      >
        <polyline
          {...LINE}
          points={map.sectors.join(" ")}
          strokeWidth={12}
          className="stroke-light-off"
        />
        {map.sectors.map((points, index) => (
          <polyline
            key={SECTORS[index].name}
            {...LINE}
            points={points}
            strokeWidth={4}
            className={SECTORS[index].stroke}
          />
        ))}
        <circle
          cx={map.start.x}
          cy={map.start.y}
          r={6}
          strokeWidth={2.5}
          className="fill-background stroke-text"
        />
      </svg>
      <ul
        aria-hidden
        className="flex flex-wrap gap-x-3.5 gap-y-1 pl-1 text-xs text-muted"
      >
        {SECTORS.map((sector) => (
          <li key={sector.name} className="flex items-center gap-1.5">
            <span className={cn("h-1 w-3.5 rounded-[2px]", sector.fill)} />
            {sector.name}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-text" />
          Start / finish
        </li>
      </ul>
    </Card>
  );
};

export const TrackMapSkeleton = () => (
  <CardSkeleton lines={8} className="min-h-[300px]" />
);
