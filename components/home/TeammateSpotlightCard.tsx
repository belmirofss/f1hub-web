import { io } from "next/cache";
import { LinkCard, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { SplitBar } from "@/components/ui/SplitBar";
import {
  getDriverStandings,
  getSeasonQualifying,
  getSeasonResults,
} from "@/lib/api/jolpica";
import { getClosestPair, getTeammatePairs } from "@/lib/domain/headToHead";
import { getTeamColor } from "@/lib/domain/teams";

// The season's most even qualifying battle between teammates
export const TeammateSpotlightCard = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const [results, qualifying, standings] = await Promise.all([
    getSeasonResults("current"),
    getSeasonQualifying("current"),
    getDriverStandings("current"),
  ]);
  const pair = getClosestPair(
    getTeammatePairs(results, qualifying, standings?.standings ?? []),
  );
  if (!pair) return null;

  const color = getTeamColor(pair.team.constructorId);
  const [a, b] = pair.qualifying;

  return (
    <LinkCard
      href={`/standings/teammates?team=${pair.team.constructorId}`}
      aria-label={`Closest teammate battle: ${pair.a.familyName} ${a}, ${pair.b.familyName} ${b} in qualifying`}
    >
      <Label>Closest teammate battle</Label>
      <span className="flex items-center gap-2.5">
        <TeamBar color={color} height={36} />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-bold">{pair.a.familyName}</span>
            <span className="truncate font-mono text-[10px] text-muted uppercase">
              {pair.team.name} · Quali
            </span>
            <span className="truncate font-bold text-muted">
              {pair.b.familyName}
            </span>
          </span>
          <SplitBar a={a} b={b} color={color} />
        </span>
        <span className="font-mono font-bold">
          {a}–{b}
        </span>
      </span>
    </LinkCard>
  );
};

export const TeammateSpotlightCardSkeleton = () => (
  <CardSkeleton lines={1} className="min-h-[110px]" />
);
