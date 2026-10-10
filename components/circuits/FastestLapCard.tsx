import { Timer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import type { RaceResults } from "@/lib/api/types";
import { getLapRecord } from "@/lib/domain/circuits";
import { getDriverName } from "@/lib/domain/teams";

// The quickest race lap ever set here, from each race's fastest lap
export const FastestLapCard = ({
  fastestLaps,
}: {
  fastestLaps: RaceResults[];
}) => {
  const fastest = getLapRecord(fastestLaps);
  if (!fastest) return null;

  return (
    <Card
      as="section"
      aria-labelledby="fastest-lap"
      className="flex-row items-center"
    >
      <Timer
        aria-hidden
        size={22}
        strokeWidth={2}
        className="shrink-0 text-purple"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 id="fastest-lap">
          <Label>Fastest race lap</Label>
        </h2>
        <p className="truncate text-[15px] font-bold">
          {getDriverName(fastest.result.Driver)} · {fastest.race.season}
        </p>
      </div>
      <p className="font-mono text-[17px] font-bold text-purple">
        {fastest.result.FastestLap?.Time.time}
      </p>
    </Card>
  );
};
