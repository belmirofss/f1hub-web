import { io } from "next/cache";
import { Card, InlineLink, TeamBar } from "@/components/ui/Card";
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

// The season's most even qualifying battle between teammates, with their
// qualifying and race head-to-heads
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
  const rows = [
    { label: "Qualifying", score: pair.qualifying },
    { label: "Races", score: pair.race },
  ];

  return (
    <Card as="section" aria-labelledby="teammate-battle">
      <div className="flex items-center justify-between gap-3">
        <h2 id="teammate-battle">
          <Label>Closest teammate battle</Label>
        </h2>
        <InlineLink
          href={`/standings/teammates?team=${pair.team.constructorId}`}
        >
          Teammates
        </InlineLink>
      </div>
      <div className="flex items-center gap-2.5">
        <TeamBar color={color} height={36} />
        <p className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-bold">
            {pair.a.familyName} <span className="text-muted">vs</span>{" "}
            {pair.b.familyName}
          </span>
          <span className="truncate font-mono text-[10px] text-muted uppercase">
            {pair.team.name} · {pair.rounds}{" "}
            {pair.rounds === 1 ? "round" : "rounds"}
          </span>
        </p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {rows.map(({ label, score: [a, b] }) => (
          <li key={label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                {label}
              </span>
              <span className="font-mono text-sm font-bold">
                <span className="sr-only">
                  {pair.a.familyName} {a}, {pair.b.familyName} {b}
                </span>
                <span aria-hidden>
                  {a}–{b}
                </span>
              </span>
            </div>
            <SplitBar a={a} b={b} color={color} />
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const TeammateSpotlightCardSkeleton = () => (
  <CardSkeleton lines={3} className="min-h-[180px]" />
);
