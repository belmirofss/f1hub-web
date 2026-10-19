import Link from "next/link";
import { io } from "next/cache";
import {
  TitleFightCompact,
  getTitleFight,
} from "@/components/standings/TitleFightCard";
import { Card, InlineLink, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getDriverStandings, getSeasonSchedule } from "@/lib/api/jolpica";
import { driverHref } from "@/lib/domain/routes";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";

// Who can still be champion, with points bars against the leader. Once the
// title is decided the card names the champion instead of disappearing.
export const TitleFightHomeCard = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const [standings, races] = await Promise.all([
    getDriverStandings("current"),
    getSeasonSchedule("current"),
  ]);
  const leader = standings?.standings[0];
  if (!standings || !leader) return null;

  const fight = getTitleFight(
    standings.standings,
    Number(standings.round),
    races,
  );
  if (fight) return <TitleFightCompact fight={fight} />;

  return (
    <Card as="section" aria-labelledby="title-fight">
      <div className="flex items-center justify-between gap-3">
        <h2 id="title-fight">
          <Label className="text-accent-ink">Title fight · decided</Label>
        </h2>
        <InlineLink href="/standings">Standings</InlineLink>
      </div>
      <Link
        href={driverHref(leader.Driver.driverId)}
        className="group flex items-center gap-3"
      >
        <TeamBar
          color={getTeamColor(leader.Constructors.at(-1)?.constructorId)}
          height={44}
        />
        <span className="flex min-w-0 flex-col">
          <span className="text-xs text-muted">
            {standings.season} World Champion
          </span>
          <span className="display-title text-[26px] group-hover:underline">
            {getDriverName(leader.Driver)}
          </span>
        </span>
        <span className="ml-auto font-mono text-sm font-bold">
          {leader.points}
          <span className="sr-only"> points</span>
        </span>
      </Link>
    </Card>
  );
};

export const TitleFightHomeCardSkeleton = () => (
  <CardSkeleton lines={4} className="min-h-[211px]" />
);
