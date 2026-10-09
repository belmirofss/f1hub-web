import type { RaceResults } from "@/lib/api/types";
import { getCircuitFacts } from "@/lib/domain/circuits";

// Small tiles: km/lap, laps, race km, corners, first GP and races held
export const CircuitFacts = ({
  circuitId,
  races,
}: {
  circuitId: string;
  // Every race held here, oldest first
  races: RaceResults[];
}) => {
  const facts = getCircuitFacts(circuitId, races);

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
