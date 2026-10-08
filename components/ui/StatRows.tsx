import { cn } from "@/lib/cn";

export type Stat = {
  label: string;
  // Tailwind text colour class for the label: "text-purple" for fastest lap
  labelClassName?: string;
  who: string;
  value?: string;
};

// Pole / fastest lap / top gainer / retirements, one per row
export const StatRows = ({
  stats,
  className,
}: {
  stats: Stat[];
  className?: string;
}) => (
  <dl className={cn("flex flex-col divide-y divide-line-soft", className)}>
    {stats.map((stat) => (
      <div key={stat.label} className="flex min-h-11 items-center gap-2.5">
        <dt
          className={cn(
            "w-[92px] shrink-0 font-mono text-[10px] font-medium tracking-[1px] text-muted uppercase",
            stat.labelClassName,
          )}
        >
          {stat.label}
        </dt>
        <dd className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="min-w-0 flex-1 truncate text-sm font-bold">
            {stat.who}
          </span>
          {!!stat.value && (
            <span className="max-w-[45%] truncate font-mono text-xs text-soft">
              {stat.value}
            </span>
          )}
        </dd>
      </div>
    ))}
  </dl>
);
