"use client";

import { useId, useState } from "react";
import { LocalTime } from "@/components/time/LocalTime";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";
import {
  formatRain,
  formatRainChance,
  type HourForecast,
} from "@/lib/domain/weather";
import { rainClass } from "./Weather";

export type SessionForecastRow = {
  key: string;
  name: string;
  start: string; // ISO, UTC
  // The hour the session starts in, when the forecast reaches it
  hour?: HourForecast & { condition: string };
  // From an hour before the start to three after, for the rain bars
  around: Pick<HourForecast, "time" | "rainChance">[];
};

const round = Math.round;

const Detail = ({
  row,
  hour,
  id,
}: {
  row: SessionForecastRow;
  hour: NonNullable<SessionForecastRow["hour"]>;
  id: string;
}) => {
  const stats = [
    { label: "Wind km/h", value: round(hour.wind) },
    { label: "Humidity", value: `${round(hour.humidity)}%` },
    { label: "Rain mm", value: formatRain(hour.rain) },
  ];

  return (
    <div
      id={id}
      className="flex flex-col gap-3 rounded-md bg-surface-raised px-3 pt-2.5 pb-3.5"
    >
      <p className="text-sm text-soft">
        {hour.condition} ·{" "}
        <LocalTime value={row.start} format="dayClock" className="font-mono" />
      </p>
      <dl className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse">
            <dt>
              <Label className="text-[10px]">{stat.label}</Label>
            </dt>
            <dd className="font-mono text-base font-bold">{stat.value}</dd>
          </div>
        ))}
      </dl>
      {row.around.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px]">Rain chance, hour by hour</Label>
          <ol className="flex gap-1.5">
            {row.around.map((h) => (
              <li
                key={h.time}
                className="flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <span aria-hidden className="flex h-12 w-full items-end">
                  <span
                    className={cn(
                      "w-full rounded-t-[3px]",
                      h.rainChance >= 50 ? "bg-rain" : "bg-line-dashed",
                    )}
                    style={{ height: Math.max(3, h.rainChance * 0.46) }}
                  />
                </span>
                <span className="font-mono text-[10px] text-muted">
                  {formatRainChance(h.rainChance)}
                </span>
                <LocalTime
                  value={h.time}
                  className="font-mono text-[9px] text-faint"
                />
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

// One row per session: temperature and rain chance at its start. Tapping a
// row opens the conditions and the hourly rain chance around it.
export const SessionForecast = ({ rows }: { rows: SessionForecastRow[] }) => {
  const id = useId();
  const [open, setOpen] = useState(
    rows.find((row) => row.key === "race" && row.hour)?.key,
  );

  return (
    <ul>
      {rows.map((row) => {
        const { hour } = row;
        const isOpen = open === row.key && !!hour;
        const detailId = `${id}-${row.key}`;
        return (
          <li key={row.key} className="border-t border-line-soft">
            <button
              type="button"
              disabled={!hour}
              aria-expanded={hour ? isOpen : undefined}
              aria-controls={isOpen ? detailId : undefined}
              onClick={() => setOpen(isOpen ? undefined : row.key)}
              className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  "flex-1 font-bold",
                  row.key === "race" && "text-accent",
                )}
              >
                {row.name}
              </span>
              {hour ? (
                <>
                  <span className="font-mono text-[13px] text-soft">
                    {round(hour.temperature)}°
                  </span>
                  <span
                    className={cn(
                      "w-11 text-right font-mono text-[13px] font-bold",
                      rainClass(hour.rainChance),
                    )}
                  >
                    {formatRainChance(hour.rainChance)}
                    <span className="sr-only"> chance of rain</span>
                  </span>
                </>
              ) : (
                <span className="font-mono text-[11px] text-faint">
                  NOT YET
                </span>
              )}
            </button>
            {isOpen && hour && (
              <div className="pb-3">
                <Detail row={row} hour={hour} id={detailId} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
