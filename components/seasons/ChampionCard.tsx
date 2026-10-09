import Link from "next/link";
import { io } from "next/cache";
import { LinkCard, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import {
  getConstructorChampions,
  getConstructorStandings,
  getCurrentSeason,
} from "@/lib/api/jolpica";
import { driverHref, teamHref } from "@/lib/domain/routes";
import { getTeamColor } from "@/lib/domain/teams";
import type { SeasonInfo } from "@/lib/season";

const wins = (count: number) => `${count} ${count === 1 ? "win" : "wins"}`;

// Whole-card link: team bar, "DRIVERS' CHAMPION", name, team and points
const Champion = ({
  href,
  label,
  name,
  detail,
  points,
  color,
}: {
  href: string;
  label: string;
  name: string;
  detail: string;
  points: number;
  color: string;
}) => (
  <Link
    href={href}
    className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-surface-raised"
  >
    <TeamBar color={color} height={48} />
    <span className="flex min-w-0 flex-1 flex-col">
      <Label>{label}</Label>
      <span className="truncate text-lg font-bold">{name}</span>
      <span className="truncate text-xs text-muted">{detail}</span>
    </span>
    <span className="font-mono text-xl font-bold">
      {points}
      <span className="sr-only"> points</span>
    </span>
  </Link>
);

// From the season info, so it costs no requests of its own
export const DriversChampionCard = ({
  champion,
}: {
  champion: NonNullable<SeasonInfo["champion"]>;
}) => (
  <Champion
    href={driverHref(champion.driverId)}
    label="Drivers' champion"
    name={champion.driver}
    detail={`${champion.team} · ${wins(champion.wins)}`}
    points={champion.points}
    color={getTeamColor(champion.teamId)}
  />
);

// The title started in 1958. Points and wins come from the final standings,
// which the table below loads anyway.
export const ConstructorsChampionCard = async ({ year }: { year: string }) => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const teamId = (await getConstructorChampions())[year];
  if (!teamId) return null;
  const standings = await getConstructorStandings(year);
  const team = standings?.standings.find(
    (s) => s.Constructor.constructorId === teamId,
  );
  if (!team) return null;

  return (
    <Champion
      href={teamHref(teamId)}
      label="Constructors' champion"
      name={team.Constructor.name}
      detail={wins(Number(team.wins))}
      points={Number(team.points)}
      color={getTeamColor(teamId)}
    />
  );
};

// Before a season ends there's no champion, so point to the live standings
export const SeasonInProgressCard = async ({ year }: { year: string }) => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  if (Number(year) !== (await getCurrentSeason())) return null;

  return (
    <LinkCard href="/standings">
      <Label>Season in progress</Label>
      <span className="font-bold">Title fight and what-if</span>
    </LinkCard>
  );
};
