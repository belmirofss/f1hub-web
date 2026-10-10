import Link from "next/link";
import { io } from "next/cache";
import { Card, InlineLink, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getConstructorStandings } from "@/lib/api/jolpica";
import { teamHref } from "@/lib/domain/routes";
import { getTeamColor } from "@/lib/domain/teams";

// The constructors' top 5, each with a bar against the leader's points
export const ConstructorsCard = async () => {
  // Request time, so the build doesn't depend on the APIs
  await io();
  const standings = await getConstructorStandings("current");
  const top = standings?.standings.slice(0, 5) ?? [];
  if (!top.length) return null;
  const leaderPoints = Number(top[0].points) || 1;

  return (
    <Card as="section" aria-labelledby="constructors" className="gap-1">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 id="constructors">
          <Label>Constructors</Label>
        </h2>
        <InlineLink href="/standings/constructors">Standings</InlineLink>
      </div>
      <ol>
        {top.map((standing) => {
          const color = getTeamColor(standing.Constructor.constructorId);
          return (
            <li
              key={standing.Constructor.constructorId}
              className="border-t border-line-soft"
            >
              <Link
                href={teamHref(standing.Constructor.constructorId)}
                className="group flex min-h-11 items-center gap-2"
              >
                <span className="w-[18px] font-mono text-sm font-bold">
                  {standing.position}
                </span>
                <TeamBar color={color} height={24} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-bold group-hover:underline">
                    {standing.Constructor.name}
                  </span>
                  <span aria-hidden className="block h-1 bg-surface-raised">
                    <span
                      className="block h-1"
                      style={{
                        width: `${(Number(standing.points) / leaderPoints) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </span>
                </span>
                <span className="w-12 text-right font-mono text-sm font-bold">
                  {standing.points}
                  <span className="sr-only"> points</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

export const ConstructorsCardSkeleton = () => (
  <CardSkeleton lines={5} className="min-h-[274px]" />
);
