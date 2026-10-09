import type { RaceResults } from "@/lib/api/types";
import { getCircuitLayout } from "@/lib/domain/circuits";

// The scheduled distance. A race cut short by rain or the time limit
// (Singapore 2022 ran 59 of 62 laps) shouldn't set it, so the longer of the
// last two races counts.
const getLaps = (races: RaceResults[]) =>
  Math.max(
    0,
    ...races.slice(-2).map((race) => Number(race.Results?.[0]?.laps ?? 0)),
  );

// Small tiles: km/lap, laps, race km, corners, first GP and races held. The
// layout numbers only exist for circuits on recent calendars.
export const CircuitFacts = ({
  circuitId,
  races,
}: {
  circuitId: string;
  // Every race held here, oldest first
  races: RaceResults[];
}) => {
  const layout = getCircuitLayout(circuitId);
  const laps = getLaps(races);
  const facts = [
    layout && { label: "Km / lap", value: layout.length.toFixed(3) },
    laps > 0 && { label: "Laps", value: laps },
    layout &&
      laps > 0 && {
        label: "Km race",
        value: (layout.length * laps).toFixed(1),
      },
    layout && { label: "Corners", value: layout.corners },
    races[0] && { label: "First GP", value: races[0].season },
    { label: "Races held", value: races.length },
  ].filter((fact) => !!fact);

  return (
    <dl className="flex flex-wrap gap-2">
      {facts.map((fact) => (
        <div
          key={fact.label}
          // Three to a row on phones, all six in one row when they fit
          className="flex flex-[1_1_30%] flex-col-reverse justify-end gap-0.5 rounded-[10px] border border-line bg-surface px-3 py-2.5 sm:flex-[1_1_15%]"
        >
          <dt className="font-mono text-[10px] font-medium tracking-[1px] text-muted uppercase">
            {fact.label}
          </dt>
          <dd className="font-mono text-[17px] font-bold">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
};
