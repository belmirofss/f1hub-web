import type { RaceResults } from "@/lib/api/types";
import { getCircuitFacts } from "@/lib/domain/circuits";

// The six numbers in mono: lap length, laps, race distance, turns, first race
// and races held. Two to a row in the side panel, three on phones, all six
// in a row when the panel runs full width (no map).
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
    <dl className="grid grid-cols-2 gap-x-3 gap-y-4 @[300px]:grid-cols-3 @3xl:grid-cols-6">
      {facts.map((fact) => (
        <div key={fact.key} className="flex flex-col-reverse justify-end">
          <dt className="font-mono text-[10px] font-medium tracking-[0.12em] text-muted uppercase">
            {fact.label}
          </dt>
          <dd className="big-number text-[22px] leading-tight lg:text-2xl">
            {fact.value}
            {fact.unit && (
              <span className="text-sm font-medium"> {fact.unit}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
};
