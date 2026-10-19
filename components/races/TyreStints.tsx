// Tyre compounds and the stint bar: one segment per stint, from lap 1 to the
// last lap, coloured by compound. Used by the results tables and the
// Analysis tab's tyre strategy.
import type { Stint } from "@/lib/api/types";
import { cn } from "@/lib/cn";

export type Compound = { name: string; letter: string; className: string };

export const COMPOUNDS: Record<string, Compound> = {
  SOFT: {
    name: "Soft",
    letter: "S",
    className: "bg-[#D2232D] text-white",
  },
  MEDIUM: {
    name: "Medium",
    letter: "M",
    className: "bg-sprint text-text",
  },
  HARD: {
    name: "Hard",
    letter: "H",
    className: "bg-white text-text ring-1 ring-line-dashed ring-inset",
  },
  INTERMEDIATE: {
    name: "Inter",
    letter: "I",
    className: "bg-gain text-white",
  },
  WET: { name: "Wet", letter: "W", className: "bg-[#1F5FC8] text-white" },
};
const UNKNOWN_COMPOUND: Compound = {
  name: "Unknown",
  letter: "?",
  className: "bg-line-dashed text-text",
};

export const getCompound = (stint: Stint) =>
  COMPOUNDS[stint.compound] ?? UNKNOWN_COMPOUND;

export const stintLaps = (stint: Stint) => stint.lap_end - stint.lap_start + 1;

// OpenF1 leaves lap_end empty on a stint that's still running
export const finishedStints = (stints: Stint[]) =>
  stints.filter((s) => s.lap_end != null && s.lap_end >= s.lap_start);

// Each car's stints in order, by car number (OpenF1 knows drivers by number,
// which the results carry too)
export const groupStints = (stints: Stint[]) => {
  const byCar = new Map<number, Stint[]>();
  for (const stint of finishedStints(stints)) {
    const own = byCar.get(stint.driver_number) ?? [];
    own.push(stint);
    byCar.set(stint.driver_number, own);
  }
  byCar.forEach((own) => own.sort((a, b) => a.stint_number - b.stint_number));
  return byCar;
};

// The race distance the bars are drawn against
export const getStintsTotal = (byCar: Map<number, Stint[]>, laps: number) =>
  Math.max(
    laps,
    ...Array.from(byCar.values(), (own) => own.at(-1)?.lap_end ?? 0),
  );

// "Medium 20 laps, Hard 36 laps"
export const describeStints = (stints: Stint[]) =>
  stints
    .map((s) => {
      const laps = stintLaps(s);
      return `${getCompound(s).name} ${laps} ${laps === 1 ? "lap" : "laps"}`;
    })
    .join(", ");

// The bar itself. The segments are decoration: the text alternative says the
// same thing. `labels` writes "M 20" inside segments wide enough for it.
export const StintBar = ({
  stints,
  total,
  labels = false,
  className,
}: {
  stints: Stint[];
  total: number;
  labels?: boolean;
  className?: string;
}) => {
  const lastLap = stints.at(-1)?.lap_end ?? 0;

  return (
    <span className={cn("flex min-w-0 gap-0.5", className)}>
      <span className="sr-only">{describeStints(stints)}</span>
      {stints.map((stint) => {
        const compound = getCompound(stint);
        const laps = stintLaps(stint);
        return (
          <span
            key={stint.stint_number}
            aria-hidden
            className={cn(
              "flex min-w-0 basis-0 items-center overflow-hidden font-mono text-[10px] font-bold whitespace-nowrap",
              labels && "pl-[5px]",
              compound.className,
            )}
            style={{ flexGrow: laps }}
          >
            {labels &&
              (laps >= 6 ? `${compound.letter} ${laps}` : compound.letter)}
          </span>
        );
      })}
      {/* Laps the car didn't run */}
      {lastLap < total && (
        <span
          aria-hidden
          className="basis-0"
          style={{ flexGrow: total - lastLap }}
        />
      )}
    </span>
  );
};

// "■ Soft ■ Medium ■ Hard": only the compounds that were used
export const CompoundLegend = ({
  stints,
  className,
}: {
  stints: Stint[];
  className?: string;
}) => {
  const used = new Set(stints.map((s) => s.compound));
  return (
    <ul
      aria-label="Tyre compounds"
      className={cn(
        "flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-muted",
        className,
      )}
    >
      {Object.entries(COMPOUNDS)
        .filter(([key]) => used.has(key))
        .map(([key, compound]) => (
          <li key={key} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2.5", compound.className)} />
            {compound.name}
          </li>
        ))}
    </ul>
  );
};
