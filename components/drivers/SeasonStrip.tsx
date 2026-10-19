import type { CSSProperties } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  getRoundsWithResults,
  getSeasonSchedule,
  type CareerRace,
} from "@/lib/api/jolpica";
import { cn } from "@/lib/cn";
import { getCountryCode3ByName } from "@/lib/domain/countries";
import { raceHref } from "@/lib/domain/routes";
import type { TeamHero } from "@/lib/domain/teams";

type Square = {
  text: string;
  status: string;
  className: string;
  style?: CSSProperties;
};

// One square per round of the driver's latest season (a former driver's
// final one): a win in the team colour, a podium in ink, other finishes on
// paper, a retirement as an outlined "R", a round they missed as a dash and
// the rounds still to run empty. Each square opens that race.
export const SeasonStrip = async ({
  season,
  races,
  hero,
  final,
}: {
  season: string;
  // The driver's starts that season
  races: CareerRace[];
  hero: TeamHero;
  // Their last season, not one still going
  final?: boolean;
}) => {
  const [schedule, run] = await Promise.all([
    getSeasonSchedule(season),
    getRoundsWithResults(season),
  ]);
  if (!schedule.length) return null;
  const started = new Map(races.map((race) => [race.round, race]));
  const done = new Set(run.race);

  const square = (round: string): Square => {
    const race = started.get(round);
    if (!race) {
      return done.has(round)
        ? {
            text: "–",
            status: "did not start",
            className: "border-dashed border-line-dashed text-muted",
          }
        : {
            text: "",
            status: "still to run",
            className: "border-dashed border-line-dashed",
          };
    }
    const { position } = race;
    if (position === 0)
      return {
        text: "R",
        status: "retired",
        className: "border-line-dashed text-muted",
      };
    if (position === 1)
      // The neutral ink block would look like a podium, so a win without a
      // team colour stays vermilion
      return {
        text: "1",
        status: "won",
        className: hero.team ? "" : "border-accent bg-accent text-on-accent",
        style: hero.team
          ? {
              backgroundColor: hero.background,
              borderColor: hero.background,
              color: hero.text,
            }
          : undefined,
      };
    return {
      text: String(position),
      status: `P${position}`,
      className:
        position <= 3
          ? "border-text bg-text text-background"
          : "border-line bg-surface",
    };
  };

  return (
    <Card as="section" aria-labelledby="every-race">
      <h2 id="every-race">
        <Label>
          {season} · {final ? "Final season" : "Every race"}
        </Label>
      </h2>
      <ol className="grid grid-cols-8 gap-[5px] sm:grid-cols-12">
        {schedule.map((race) => {
          const { text, status, className, style } = square(race.round);
          const code = getCountryCode3ByName(race.Circuit.Location.country);
          return (
            <li key={race.round} className="min-w-0">
              <Link
                href={raceHref(race, schedule)}
                aria-label={`Round ${race.round}, ${race.raceName}: ${status}`}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "flex aspect-square w-full items-center justify-center border font-mono text-xs font-bold transition-opacity group-hover:opacity-80 lg:text-sm",
                    className,
                  )}
                  style={style}
                >
                  {text}
                </span>
                <span
                  aria-hidden
                  className="text-[10px] font-semibold text-muted group-hover:text-text max-sm:hidden"
                >
                  {code}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

export const SeasonStripSkeleton = () => (
  <CardSkeleton lines={3} className="min-h-[160px]" />
);
