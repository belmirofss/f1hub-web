import type { RaceResults } from "@/lib/api/types";
import { getLapRecord } from "@/lib/domain/circuits";
import { getDriverName } from "@/lib/domain/teams";

// The quickest race lap ever set here, from each race's fastest lap: the
// time big, then who and when
export const LapRecord = ({ fastestLaps }: { fastestLaps: RaceResults[] }) => {
  const record = getLapRecord(fastestLaps);
  if (!record) return null;

  return (
    <section
      aria-labelledby="lap-record"
      className="flex flex-col gap-1 bg-surface-raised p-4"
    >
      <h2
        id="lap-record"
        className="font-mono text-[10px] font-medium tracking-[0.14em] text-purple uppercase"
      >
        Race lap record
      </h2>
      <p className="big-number text-[30px] leading-tight">
        {record.result.FastestLap?.Time.time}
      </p>
      <p className="text-[13px] text-soft">
        {getDriverName(record.result.Driver)} · {record.race.season}
      </p>
    </section>
  );
};
