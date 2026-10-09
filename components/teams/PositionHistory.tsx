import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getConstructorSeasonPositions } from "@/lib/api/jolpica";
import { cn } from "@/lib/cn";
import { ordinal, shortYear } from "@/lib/domain/drivers";
import { seasonHref } from "@/lib/domain/routes";

const COUNT = 6;

// Constructors' championship position in the team's last six seasons, title
// years in the accent. Each tile opens that season's constructors' table.
export const PositionHistory = async ({
  constructorId,
  seasons,
  titles,
}: {
  constructorId: string;
  // Every season the team raced, oldest first
  seasons: string[];
  titles: string[];
}) => {
  const positions = await getConstructorSeasonPositions(
    constructorId,
    seasons.slice(-COUNT),
  );
  // The constructors' championship started in 1958
  if (!positions.some((p) => p.position > 0)) return null;

  return (
    <Card as="section" aria-labelledby="position-history">
      <h2 id="position-history">
        <Label>Constructors&apos; position</Label>
      </h2>
      <ol className="flex gap-1.5">
        {positions.map(({ season, position }) => {
          const won = titles.includes(season);
          return (
            <li key={season} className="flex max-w-20 min-w-0 flex-1">
              <Link
                href={`${seasonHref(season)}/constructors`}
                aria-label={`${season}: ${position ? ordinal(position) : "not ranked"}${won ? ", champions" : ""}`}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1.5 rounded-md py-2.5 font-mono transition-[filter] hover:brightness-125",
                  won ? "bg-accent text-on-accent" : "bg-surface-raised",
                )}
              >
                <span className="text-base font-bold">
                  {position ? `P${position}` : "–"}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    won ? "text-on-accent" : "text-muted",
                  )}
                >
                  {shortYear(season)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

export const PositionHistorySkeleton = () => (
  <CardSkeleton lines={1} className="min-h-[124px]" />
);
