import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getDriverSeasonStandings } from "@/lib/api/jolpica";
import { cn } from "@/lib/cn";
import { ordinal, shortYear } from "@/lib/domain/drivers";
import { seasonHref } from "@/lib/domain/routes";

const COUNT = 8;
const MAX_BAR = 96;

// Championship position per season as bars: taller = better, titles in the
// accent and the other podiums in white. Each bar opens that season.
export const SeasonBars = async ({
  driverId,
  seasons,
}: {
  driverId: string;
  // Every season the driver raced, oldest first
  seasons: string[];
}) => {
  const standings = await getDriverSeasonStandings(
    driverId,
    seasons.slice(-COUNT),
  );
  const shown = standings.flatMap(({ season, standing }) => {
    const position = Number(standing?.position);
    return position > 0 ? [{ season, position }] : [];
  });
  if (!shown.length) return null;
  const worst = Math.max(20, ...shown.map((s) => s.position));

  return (
    <Card as="section" aria-labelledby="season-bars">
      <div className="flex justify-between">
        <h2 id="season-bars">
          <Label>Championship by season</Label>
        </h2>
        <Label aria-hidden>Pos</Label>
      </div>
      <ol className="flex h-[148px] gap-2">
        {shown.map(({ season, position }) => (
          <li key={season} className="flex max-w-16 min-w-0 flex-1">
            <Link
              href={seasonHref(season)}
              aria-label={`${season}: ${ordinal(position)}`}
              className="group flex flex-1 flex-col items-center justify-end gap-1"
            >
              <span
                className={cn(
                  "font-mono text-[11px] font-bold",
                  position === 1 && "text-accent-ink",
                )}
              >
                P{position}
              </span>
              <span
                className={cn(
                  "w-full rounded-t-[4px] transition-opacity group-hover:opacity-80",
                  position === 1
                    ? "bg-accent"
                    : position <= 3
                      ? "bg-text"
                      : "bg-light-off",
                )}
                style={{
                  height: Math.max(
                    4,
                    ((worst + 1 - position) / worst) * MAX_BAR,
                  ),
                }}
              />
              <span className="pt-1 font-mono text-[10px] text-muted group-hover:text-text">
                {shortYear(season)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
};

export const SeasonBarsSkeleton = () => (
  <CardSkeleton lines={4} className="min-h-[210px]" />
);
