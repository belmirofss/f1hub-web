import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import type { RaceResults } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getWinsByDriver } from "@/lib/domain/circuits";
import { driverHref } from "@/lib/domain/routes";
import { getDriverName } from "@/lib/domain/teams";

const COUNT = 3;

// The drivers who won here most, as bars against the leader. Hidden until
// someone has won here twice.
export const MostWins = ({ races }: { races: RaceResults[] }) => {
  const top = getWinsByDriver(races).slice(0, COUNT);
  const most = top[0]?.wins ?? 0;
  if (most < 2) return null;

  return (
    <Card as="section" aria-labelledby="most-wins">
      <h2 id="most-wins">
        <Label>Most wins here</Label>
      </h2>
      <ol className="flex flex-col">
        {top.map(({ driver, wins }, index) => (
          <li key={driver.driverId}>
            <Link
              href={driverHref(driver.driverId)}
              className="group flex min-h-9 items-center gap-2.5"
            >
              <span className="w-[130px] shrink-0 truncate text-sm font-bold group-hover:underline">
                {getDriverName(driver)}
              </span>
              <span
                aria-hidden
                className="h-2 flex-1 rounded-[4px] bg-surface-raised"
              >
                <span
                  className={cn(
                    "block h-full rounded-[4px]",
                    index === 0 ? "bg-accent" : "bg-text",
                  )}
                  style={{ width: `${(wins / most) * 100}%` }}
                />
              </span>
              <span className="w-5 text-right font-mono text-sm font-bold">
                {wins}
                <span className="sr-only"> {wins === 1 ? "win" : "wins"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
};
