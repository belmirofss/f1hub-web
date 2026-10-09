"use client";

// Ported from the LapChart in the app's src/screens/RaceWeekend/AnalysisTab.tsx.
// Positions come computed from the server; this only handles which drivers
// are highlighted. The lines are an SVG stretched over the plot area with
// strokes that don't scale, and the labels are HTML on top, so the text stays
// 10px whatever the chart's width.
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";

export type LapChartDriver = {
  id: string;
  code: string;
  name: string;
  color: string;
  // The second driver of a team is drawn dashed
  dashed: boolean;
  // Slot on the grid, which is lap 0
  grid: number;
  // Position at the end of each lap, until the driver stopped. null = missing.
  positions: (number | null)[];
};

const GRIDLINES = [1, 5, 10, 15, 20];
// Highlighted when the page opens
const SELECTED = 3;

export const LapChart = ({
  drivers,
  laps,
  field,
}: {
  drivers: LapChartDriver[];
  laps: number;
  // Cars in the race, which sets the bottom of the scale
  field: number;
}) => {
  const [selected, setSelected] = useState(() =>
    drivers.slice(0, SELECTED).map((driver) => driver.id),
  );

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((other) => other !== id)
        : [...current, id],
    );

  const bottom = Math.max(field - 1, 1);
  // Percentages of the plot area
  const x = (lap: number) => (lap / laps) * 100;
  const y = (position: number) => ((position - 1) / bottom) * 100;

  const points = (driver: LapChartDriver) =>
    [
      `0,${driver.grid - 1}`,
      ...driver.positions.flatMap((position, index) =>
        position === null ? [] : [`${index + 1},${position - 1}`],
      ),
    ].join(" ");

  const last = (driver: LapChartDriver) => {
    const lap = driver.positions.findLastIndex((p) => p !== null) + 1;
    return { lap, position: driver.positions[lap - 1] ?? driver.grid };
  };

  // Highlighted lines go on top
  const isOn = (driver: LapChartDriver) => selected.includes(driver.id);
  const ordered = [...drivers].sort((a, b) => +isOn(a) - +isOn(b));

  return (
    <Card as="section" aria-label="Lap chart" className="lg:p-5">
      <div className="flex justify-between">
        <Label>Lap chart · top {drivers.length}</Label>
        <Label>{laps} laps</Label>
      </div>

      <div
        role="group"
        aria-label="Highlight drivers"
        className="flex flex-wrap gap-1.5"
      >
        {drivers.map((driver) => {
          const on = isOn(driver);
          return (
            <button
              key={driver.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(driver.id)}
              className={cn(
                "flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 font-mono text-xs font-bold transition-colors",
                on
                  ? "border-line-dashed bg-surface-raised text-text"
                  : "border-line text-muted hover:text-text",
              )}
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: driver.color }}
              />
              {driver.code}
              <span className="sr-only"> {driver.name}</span>
            </button>
          );
        })}
      </div>

      <figure className="relative m-0 h-60 font-mono text-[10px] leading-none lg:h-80">
        {/* The plot area: room for "P10" on the left, driver codes on the
            right and lap numbers below */}
        <div className="absolute top-2 right-[34px] bottom-6 left-[26px]">
          <svg
            viewBox={`0 0 ${laps} ${bottom}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Position of each driver lap by lap"
            className="absolute inset-0 size-full overflow-visible"
          >
            {GRIDLINES.filter((p) => p <= field).map((p) => (
              <line
                key={p}
                x1={0}
                x2={laps}
                y1={p - 1}
                y2={p - 1}
                vectorEffect="non-scaling-stroke"
                className="stroke-line-soft"
              />
            ))}
            {ordered.map((driver) => {
              const on = isOn(driver);
              return (
                <polyline
                  key={driver.id}
                  points={points(driver)}
                  fill="none"
                  stroke={on ? driver.color : undefined}
                  strokeWidth={on ? 2.5 : 1.5}
                  strokeDasharray={driver.dashed ? "5 4" : undefined}
                  strokeLinejoin="round"
                  strokeLinecap={on ? "round" : undefined}
                  vectorEffect="non-scaling-stroke"
                  className={cn(!on && "stroke-line")}
                />
              );
            })}
          </svg>

          <div aria-hidden>
            {GRIDLINES.filter((p) => p <= field).map((p) => (
              <span
                key={p}
                className="absolute left-[-26px] -translate-y-1/2 text-faint"
                style={{ top: `${y(p)}%` }}
              >
                P{p}
              </span>
            ))}
            {drivers.filter(isOn).map((driver) => {
              const end = last(driver);
              return (
                <span
                  key={driver.id}
                  className="absolute ml-1 -translate-y-1/2 font-bold"
                  style={{
                    left: `${x(end.lap)}%`,
                    top: `${y(end.position)}%`,
                    color: driver.color,
                  }}
                >
                  {driver.code}
                </span>
              );
            })}
            {[0, Math.round(laps / 2), laps].map((lap) => (
              <span
                key={lap}
                className="absolute top-full mt-2.5 -translate-x-1/2 text-faint"
                style={{ left: `${x(lap)}%` }}
              >
                {lap === 0 ? "GRID" : `L${lap}`}
              </span>
            ))}
          </div>
        </div>
      </figure>

      <p className="text-xs text-muted">
        <span className="lg:hidden">Tap</span>
        <span className="max-lg:hidden">Select</span> drivers to compare. Dashed
        line = second driver of a team.
      </p>
    </Card>
  );
};
