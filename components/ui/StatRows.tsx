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

// Pole / fastest lap / top gainer / retirements, one per row. With
// `columns` they sit side by side from 1024px, each label above its driver,
// as a column is too narrow for the label, a full name and a time in a row.
export const StatRows = ({
  stats,
  columns,
  className,
}: {
  stats: Stat[];
  columns?: boolean;
  className?: string;
}) => (
  <dl
    className={cn(
      "flex flex-col divide-y divide-line",
      columns &&
        "lg:grid lg:grid-cols-3 lg:gap-x-6 lg:divide-y-0 lg:border-b lg:border-line",
      className,
    )}
  >
    {stats.map((stat) => (
      <div
        key={stat.label}
        className={cn(
          "flex min-h-11 items-center gap-2.5",
          columns && "lg:flex-col lg:items-stretch lg:gap-0.5 lg:py-2",
          stat.className,
        )}
      >
        <dt
          className={cn(
            "w-[92px] shrink-0 font-mono text-[10px] font-medium tracking-[0.14em] text-muted uppercase",
            columns && "lg:w-auto",
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
