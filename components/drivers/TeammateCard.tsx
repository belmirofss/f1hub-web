import Link from "next/link";
import { Label } from "@/components/ui/Label";
import {
  getCurrentSeason,
  getDriverStandings,
  getSeasonQualifying,
  getSeasonResults,
} from "@/lib/api/jolpica";
import { formatPoints } from "@/lib/domain/drivers";
import { getTeammatePairs, type Score } from "@/lib/domain/headToHead";
import { seasonHref } from "@/lib/domain/routes";

// The head-to-head with the driver's teammate in their latest season as
// three cards (qualifying, race, points), each linking to that team's full
// battle. Shares its data with the Teammates pages.
export const TeammateCards = async ({
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
  const href = `${page}?team=${pair.team.constructorId}`;
  const cards = [
    { label: "Quali", name: "Qualifying", value: score(pair.qualifying) },
    { label: "Race", name: "Race", value: score(pair.race) },
    {
      label: "Points",
      name: "Points",
      value: score(pair.points, formatPoints),
    },
  ];

  return (
    <section aria-labelledby="teammate" className="flex flex-col gap-2">
      <h2 id="teammate">
        <Label>
          VS teammate · {teammate.familyName} · {season}
        </Label>
      </h2>
      <ul className="grid grid-cols-3 gap-2.5 lg:gap-3.5">
        {cards.map((card) => (
          <li key={card.label} className="flex min-w-0">
            <Link
              href={href}
              aria-label={`${card.name} against ${teammate.givenName} ${teammate.familyName}: ${card.value}. Open the teammate battle`}
              className="flex min-w-0 flex-1 flex-col gap-1 border-t-2 border-text pt-2.5 pb-2 transition-colors hover:bg-surface lg:px-1"
            >
              <Label aria-hidden>{card.label}</Label>
              <span
                aria-hidden
                className="truncate big-number text-[22px] leading-7 lg:text-[30px] lg:leading-9"
              >
                {card.value}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
