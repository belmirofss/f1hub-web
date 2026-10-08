import Link from "next/link";
import { io } from "next/cache";
import { Card, InlineLink, TeamBar } from "@/components/ui/Card";
import { FormChips, FormLegend } from "@/components/ui/FormChips";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getDriverStandings, getRecentForm } from "@/lib/api/jolpica";
import { driverHref } from "@/lib/domain/routes";
import { getDriverCode, getDriverName, getTeamColor } from "@/lib/domain/teams";

export const TopFiveCard = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const standings = await getDriverStandings("current");
  if (!standings?.standings.length) return null;

  // Waits for the form squares too, so the rows don't shift when they arrive
  const form = await getRecentForm(standings.season, Number(standings.round));

  return (
    <Card as="section" aria-labelledby="top-five" className="gap-1">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 id="top-five">
          <Label>Top 5 · last 5 races</Label>
        </h2>
        <InlineLink href="/standings">All</InlineLink>
      </div>
      <ol>
        {standings.standings.slice(0, 5).map((standing) => (
          <li
            key={standing.Driver.driverId}
            className="border-t border-line-soft"
          >
            <Link
              href={driverHref(standing.Driver.driverId)}
              className="group flex min-h-11 items-center gap-2"
            >
              <span className="w-[18px] font-mono text-sm font-bold">
                {standing.position}
              </span>
              <TeamBar
                color={getTeamColor(
                  standing.Constructors.at(-1)?.constructorId,
                )}
                height={24}
              />
              <span className="flex-1 font-bold group-hover:underline">
                <abbr
                  title={getDriverName(standing.Driver)}
                  className="no-underline"
                >
                  {getDriverCode(standing.Driver)}
                </abbr>
              </span>
              <FormChips form={form.drivers[standing.Driver.driverId]} />
              <span className="w-10 text-right font-mono text-sm font-bold">
                {standing.points}
                <span className="sr-only"> points</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {/* Desktop leaves the legend to the Standings page */}
      <FormLegend className="border-t border-line-soft pt-2.5 lg:hidden" />
    </Card>
  );
};

export const TopFiveCardSkeleton = () => (
  <CardSkeleton lines={5} className="min-h-[330px] lg:min-h-[280px]" />
);
