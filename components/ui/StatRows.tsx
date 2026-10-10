import { cn } from "@/lib/cn";

export type Stat = {
  label: string;
  // Tailwind text colour class for the label: "text-purple" for fastest lap
  labelClassName?: string;
  who: string;
  value?: string;
  // Hides the row at some widths: "lg:hidden"
  className?: string;
};

// Pole / fastest lap / top gainer / retirements, one per row
export const StatRows = ({
  stats,
  className,
}: {
  stats: Stat[];
  className?: string;
}) => (
  <dl className={cn("flex flex-col divide-y divide-line", className)}>
    {stats.map((stat) => (
      <div
        key={stat.label}
        className={cn("flex min-h-11 items-center gap-2.5", stat.className)}
      >
        <dt
          className={cn(
            "w-[92px] shrink-0 font-mono text-[10px] font-medium tracking-[0.14em] text-muted uppercase",
            stat.labelClassName,
          )}
        >
          {stat.label}
        </dt>
        <dd className="flex min-w-0 flex-1 items-center gap-2.5">
          {/* Values are short (a time, "▲12"), so the name wraps instead */}
          <span className="min-w-0 flex-1 py-1 text-sm leading-tight font-bold break-words">
            {stat.who}
          </span>
          {!!stat.value && (
            <span className="shrink-0 font-mono text-xs whitespace-nowrap text-soft">
              {stat.value}
            </span>
          )}
        </dd>
      </div>
    ))}
  </dl>
);
