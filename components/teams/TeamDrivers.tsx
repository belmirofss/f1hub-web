import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getDriverStandings } from "@/lib/api/jolpica";
import type { DriverStanding } from "@/lib/api/types";
import { formatPoints } from "@/lib/domain/drivers";
import { driverHref } from "@/lib/domain/routes";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";

// "P1 · 8 WINS". Drivers who never scored have no position.
const details = (standing: DriverStanding) => {
  const wins = Number(standing.wins);
  return [
    standing.position
      ? `P${standing.position}`
      : standing.positionText === "D"
        ? "DSQ"
        : "UNRANKED",
    `${wins} ${wins === 1 ? "WIN" : "WINS"}`,
  ].join(" · ");
};

// Everyone who drove for the team in its latest season, in championship
// order, with their whole season's points
export const TeamDrivers = async ({
  constructorId,
  season,
}: {
  constructorId: string;
  season: string;
}) => {
  const standings = await getDriverStandings(season);
  const drivers = (standings?.standings ?? []).filter((s) =>
    s.Constructors.some((c) => c.constructorId === constructorId),
  );
  if (!drivers.length) return null;
  const color = getTeamColor(constructorId);

  return (
    <Card as="section" aria-labelledby="team-drivers" className="gap-0 pb-1">
      <h2 id="team-drivers" className="pb-2">
        <Label>Drivers · {season}</Label>
      </h2>
      <ul>
        {drivers.map((standing) => (
          <li
            key={standing.Driver.driverId}
            className="border-t border-line-soft"
          >
            <Link
              href={driverHref(standing.Driver.driverId)}
              className="group flex min-h-[58px] items-center gap-2.5 py-1"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised font-mono text-[11px] font-bold"
                style={{ color }}
              >
                {getDriverCode(standing.Driver)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-bold group-hover:underline">
                  {getDriverName(standing.Driver)}
                </span>
                <span className="font-mono text-[10px] text-muted">
                  {details(standing)}
                </span>
              </span>
              <span className="font-mono text-[15px] font-bold">
                {formatPoints(Number(standing.points))}
                <span className="sr-only"> points</span>
              </span>
              <ChevronRight
                aria-hidden
                size={16}
                strokeWidth={2}
                className="shrink-0 text-muted"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const TeamDriversSkeleton = () => (
  <CardSkeleton lines={2} className="min-h-[160px]" />
);
