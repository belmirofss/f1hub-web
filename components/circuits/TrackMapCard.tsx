import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { getRaceSession, getTrackMap } from "@/lib/api/openf1";
import type { RaceResults } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getStartLine } from "@/lib/domain/trackMap";

// Three inks that still tell apart printed in black and white: vermilion is
// the lightest, royal blue the middle, ink the darkest
const SECTORS = [
  { name: "Sector 1", stroke: "stroke-accent", fill: "bg-accent" },
  { name: "Sector 2", stroke: "stroke-second", fill: "bg-second" },
  { name: "Sector 3", stroke: "stroke-text", fill: "bg-text" },
];

const LINE = {
  fill: "none",
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const;

// The map's box: full width on phones, about 800×500 beside the side panel.
// The skeleton holds the same space. `data-track-map` tells the page there's
// a map, so the panel moves beside it.
const box = "flex flex-col gap-3";
const drawing = "mx-auto block h-auto max-h-[420px] w-full lg:max-h-[500px]";

// The circuit drawn from the winner's fastest lap of a race OpenF1 has data
// for, coloured by sector, with the start/finish line across it. Disappears
// when OpenF1 has nothing for it.
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
  const start = getStartLine(map, 18);

  return (
    <figure data-track-map className={box}>
      <svg
        viewBox={`0 0 ${map.width} ${map.height}`}
        role="img"
        aria-label={`${circuitName} track map, split into three sectors`}
        className={drawing}
      >
        {map.sectors.map((points, index) => (
          <polyline
            key={SECTORS[index].name}
            {...LINE}
            points={points}
            strokeWidth={6}
            className={SECTORS[index].stroke}
          />
        ))}
        {/* Paper under the ink line, so it shows where it crosses the ink
            of sector 3 */}
        {start && (
          <>
            <line {...start} strokeWidth={7} className="stroke-background" />
            <line {...start} strokeWidth={3} className="stroke-text" />
          </>
        )}
      </svg>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <Label>Track map · {race.season} layout</Label>
        <ul
          aria-hidden
          className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-soft"
        >
          {SECTORS.map((sector) => (
            <li key={sector.name} className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-4", sector.fill)} />
              {sector.name}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="h-3.5 w-[3px] bg-text" />
            Start / finish
          </li>
        </ul>
      </figcaption>
    </figure>
  );
};

export const TrackMapSkeleton = () => (
  <div data-track-map aria-hidden className={box}>
    <Skeleton className="aspect-[8/5] max-h-[420px] w-full lg:max-h-[500px]" />
    <Skeleton className="h-3 w-40" />
  </div>
);
