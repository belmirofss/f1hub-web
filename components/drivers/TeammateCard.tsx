import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { StatGrid } from "@/components/ui/StatGrid";
import {
  getCurrentSeason,
  getDriverStandings,
  getSeasonQualifying,
  getSeasonResults,
} from "@/lib/api/jolpica";
import { formatPoints } from "@/lib/domain/drivers";
import { getTeammatePairs, type Score } from "@/lib/domain/headToHead";
import { seasonHref } from "@/lib/domain/routes";

// The head-to-head with the driver's teammate in their latest season, linking
// to that team's full battle. Shares its data with the Teammates pages.
export const TeammateCard = async ({
  driverId,
  season,
}: {
  driverId: string;
  season: string;
}) => {
  const [results, qualifying, standings, current] = await Promise.all([
    getSeasonResults(season),
    getSeasonQualifying(season),
    getDriverStandings(season),
    getCurrentSeason(),
  ]);
  const pair = getTeammatePairs(
    results,
    qualifying,
    standings?.standings ?? [],
  ).find((p) => p.a.driverId === driverId || p.b.driverId === driverId);
  if (!pair) return null;

  const isA = pair.a.driverId === driverId;
  const teammate = isA ? pair.b : pair.a;
  // This driver's number first
  const score = ([a, b]: Score, format: (n: number) => string = String) =>
    isA ? `${format(a)}–${format(b)}` : `${format(b)}–${format(a)}`;
  const page =
    Number(season) === current
      ? "/standings/teammates"
      : `${seasonHref(season)}/teammates`;

  return (
    // Not a LinkCard: its chevron column would squeeze "320–236"
    <Link
      href={`${page}?team=${pair.team.constructorId}`}
      aria-label={`Teammate battle against ${teammate.givenName} ${teammate.familyName} in ${season}: qualifying ${score(pair.qualifying)}, race ${score(pair.race)}, points ${score(pair.points, formatPoints)}`}
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-surface-raised"
    >
      <span className="flex items-center justify-between gap-3">
        <Label>
          VS teammate · {teammate.familyName} · {season}
        </Label>
        <ChevronRight
          aria-hidden
          size={16}
          strokeWidth={2}
          className="shrink-0 text-muted"
        />
      </span>
      <StatGrid
        stats={[
          { label: "Quali", value: score(pair.qualifying) },
          { label: "Race", value: score(pair.race) },
          { label: "Points", value: score(pair.points, formatPoints) },
        ]}
      />
    </Link>
  );
};
