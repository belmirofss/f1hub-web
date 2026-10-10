import { Card, InlineLink, TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getCircuitHistory } from "@/lib/api/jolpica";
import {
  OPENF1_FIRST_SEASON,
  getRaceSession,
  getTrackMap,
} from "@/lib/api/openf1";
import type { RaceResults } from "@/lib/api/types";
import { getCircuitFacts, getLapRecord } from "@/lib/domain/circuits";
import { circuitHref } from "@/lib/domain/routes";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";
import { orFallback } from "@/lib/metadata";
import { getNextWeekend } from "@/lib/nextWeekend";

// The outline from the latest race OpenF1 covers here. Extra: the card
// still shows without it.
const loadOutline = async (races: RaceResults[]) => {
  const race = races.findLast(
    (race) => Number(race.season) >= OPENF1_FIRST_SEASON,
  );
  const winner = race?.Results?.[0];
  if (!race || !winner) return null;
  const session = await orFallback(getRaceSession(race.season, race.date));
  return session && orFallback(getTrackMap(session, Number(winner.number)));
};

// The next race's circuit: its outline, laps and length, the lap record and
// the last three winners here
export const CircuitGlanceCard = async () => {
  const { race } = await getNextWeekend();
  if (!race) return null;

  const { circuitId, circuitName } = race.Circuit;
  const { races, fastestLaps } = await getCircuitHistory(circuitId);
  const map = await loadOutline(races);
  const facts = getCircuitFacts(circuitId, races).filter((fact) =>
    ["Laps", "Km / lap", "Corners"].includes(fact.label),
  );
  const record = getLapRecord(fastestLaps);
  const winners = races.slice(-3).reverse();

  return (
    <Card as="section" aria-labelledby="circuit-glance">
      <div className="flex items-center justify-between gap-3">
        <h2 id="circuit-glance">
          <Label>Circuit at a glance</Label>
        </h2>
        <InlineLink href={circuitHref(circuitId)}>Circuit guide</InlineLink>
      </div>
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="display-title text-[22px]">{circuitName}</p>
          <p className="text-xs text-muted">
            {race.Circuit.Location.locality}, {race.Circuit.Location.country}
          </p>
        </div>
        {map && (
          <svg
            viewBox={`0 0 ${map.width} ${map.height}`}
            role="img"
            aria-label={`${circuitName} outline`}
            className="h-[84px] w-[110px] shrink-0"
          >
            <polyline
              points={map.sectors.join(" ")}
              fill="none"
              strokeWidth={14}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-text"
            />
            <circle
              cx={map.start.x}
              cy={map.start.y}
              r={11}
              className="fill-accent"
            />
          </svg>
        )}
      </div>
      {facts.length > 0 && (
        <dl className="flex border-y border-line-soft">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-1 flex-col-reverse gap-0.5 py-2"
            >
              <dt className="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
                {fact.label}
              </dt>
              <dd className="font-mono text-base font-bold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {record && (
        <p className="flex items-baseline gap-2 text-sm">
          <span className="font-mono text-[10px] tracking-[0.14em] text-purple uppercase">
            Lap record
          </span>
          <span className="min-w-0 flex-1 truncate font-bold">
            {getDriverName(record.result.Driver)} · {record.race.season}
          </span>
          <span className="font-mono text-[13px] font-bold text-purple">
            {record.result.FastestLap?.Time.time}
          </span>
        </p>
      )}
      {winners.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3>
            <Label className="text-[10px]">Last winners here</Label>
          </h3>
          <ol>
            {winners.map((winnerRace) => {
              const winner = winnerRace.Results?.[0];
              if (!winner) return null;
              return (
                <li
                  key={winnerRace.season}
                  className="flex min-h-8 items-center gap-2 border-t border-line-soft text-sm"
                >
                  <span className="w-10 font-mono text-xs text-muted">
                    {winnerRace.season}
                  </span>
                  <TeamBar
                    color={getTeamColor(winner.Constructor.constructorId)}
                    height={16}
                  />
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {getDriverName(winner.Driver)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
};

export const CircuitGlanceCardSkeleton = () => (
  <CardSkeleton lines={6} className="min-h-[375px]" />
);
