"use client";

// The final-round simulator from the app's TitleFightCard: pick where each
// contender finishes and see who's champion
import { useState } from "react";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { TeamBar } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";
import {
  NO_POINTS_POSITION,
  getWhatIfOutcome,
  getWhatIfStart,
  stepWhatIfPosition,
  type Contender,
} from "@/lib/domain/championship";
import { getDriverName, getTeamColor } from "@/lib/domain/teams";

const StepButton = ({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) => {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 shrink-0 cursor-pointer items-center justify-center border border-line bg-surface-raised transition-colors hover:bg-line active:bg-line disabled:cursor-default disabled:opacity-35 disabled:hover:bg-surface-raised"
    >
      <Icon aria-hidden size={18} strokeWidth={2} />
    </button>
  );
};

const positionLabel = (position: number) =>
  position < NO_POINTS_POSITION ? `P${position}` : `P${NO_POINTS_POSITION}+`;

export const WhatIf = ({
  contenders,
  raceName,
}: {
  contenders: Contender[];
  raceName?: string;
}) => {
  const [positions, setPositions] = useState(() => getWhatIfStart(contenders));
  const { totals, clash, champion, verdict } = getWhatIfOutcome(
    contenders,
    positions,
  );

  const move = (code: string, delta: number) =>
    setPositions((current) => ({
      ...current,
      [code]: stepWhatIfPosition(current[code], delta),
    }));

  return (
    <section aria-labelledby="what-if" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="what-if">
          <Label>
            What if
            {raceName && ` · ${raceName.replace(" Grand Prix", "")}`}
          </Label>
        </h3>
        <button
          type="button"
          onClick={() => setPositions(getWhatIfStart(contenders))}
          className="relative cursor-pointer text-[13px] font-bold text-accent-ink after:absolute after:-inset-x-2 after:-inset-y-3 hover:underline"
        >
          Reset
        </button>
      </div>
      <ul className="flex flex-col gap-2.5">
        {totals.map((contender) => {
          const position = positions[contender.code];
          const name = getDriverName(contender.standing.Driver);
          return (
            <li key={contender.code} className="flex items-center gap-2.5">
              <TeamBar
                color={getTeamColor(
                  contender.standing.Constructors.at(-1)?.constructorId,
                )}
                height={28}
              />
              <abbr
                title={name}
                className="w-[34px] font-mono text-[13px] font-bold no-underline"
              >
                {contender.code}
              </abbr>
              <StepButton
                direction="up"
                label={`Move ${name} up one place`}
                disabled={position <= 1}
                onClick={() => move(contender.code, -1)}
              />
              <span className="w-[46px] text-center font-mono text-[15px] font-bold">
                <span className="sr-only">{name} finishes </span>
                {positionLabel(position)}
              </span>
              <StepButton
                direction="down"
                label={`Move ${name} down one place`}
                disabled={position >= NO_POINTS_POSITION}
                onClick={() => move(contender.code, 1)}
              />
              <span
                className={cn(
                  "flex-1 text-right font-mono text-[15px] font-bold",
                  contender.code === champion?.code && "text-accent-ink",
                )}
              >
                {+contender.total.toFixed(1)}
                <span className="sr-only"> points</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-faint">
        Arrows move a driver up or down the order. P{NO_POINTS_POSITION}+ scores
        nothing.
      </p>
      <p
        aria-live="polite"
        className={cn(
          "flex items-center gap-2.5 p-3 text-[15px] font-bold",
          champion
            ? "bg-accent text-on-accent"
            : clash
              ? "bg-surface-raised text-loss"
              : "bg-surface-raised text-text",
        )}
      >
        <Trophy aria-hidden size={20} strokeWidth={2} className="shrink-0" />
        {verdict}
      </p>
    </section>
  );
};
