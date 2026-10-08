// Ported from the app's src/components/Weather.tsx. The weekend forecast
// cards for the race weekend's Schedule tab (#12) go here too.
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  formatRainChance,
  getRainLevel,
  type ConditionIcon as Icon,
  type WeatherSummary as Summary,
} from "@/lib/domain/weather";

const ICONS: Record<Icon, ComponentType<LucideProps>> = {
  clear: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

export const ConditionIcon = ({
  icon,
  ...props
}: { icon: Icon } & LucideProps) => {
  const Component = ICONS[icon];
  return <Component aria-hidden strokeWidth={2} {...props} />;
};

// Rain chance in blue when it's likely, white when possible, grey when dry
export const rainClass = (chance: number) =>
  ({ likely: "text-rain", possible: "text-text", dry: "text-muted" })[
    getRainLevel(chance)
  ];

const round = Math.round;

// "Rain likely · 24–33°C · WIND 14 KM/H · OPEN-METEO   98%"
export const WeatherSummary = ({
  summary,
  className,
}: {
  summary: Summary;
  className?: string;
}) => {
  const { headline, rainChance, low, high, wind, condition } = summary;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md bg-surface-raised px-3 py-2.5 lg:p-3",
        className,
      )}
    >
      <ConditionIcon
        icon={condition.icon}
        className={cn(
          "size-[22px] shrink-0 lg:size-6",
          rainChance >= 50 ? "text-rain" : "text-sprint",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold lg:text-[15px]">{headline}</p>
        <p className="font-mono text-[10px] text-muted">
          {round(low)}–{round(high)}°C · WIND {round(wind)} KM/H · OPEN-METEO
        </p>
      </div>
      <p
        className={cn(
          "font-mono text-[13px] font-bold lg:text-sm",
          rainClass(rainChance),
        )}
      >
        {formatRainChance(rainChance)}
        <span className="sr-only"> chance of rain</span>
      </p>
    </div>
  );
};
