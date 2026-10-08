import { cn } from "@/lib/cn";

export type GridStat = {
  label: string;
  value: string | number;
  // Tailwind text colour class for the value, e.g. "text-accent"
  className?: string;
};

// Big mono numbers in equal columns: "423 PTS   7 WINS   18 PODIUMS"
export const StatGrid = ({
  stats,
  className,
}: {
  stats: GridStat[];
  className?: string;
}) => (
  <dl className={cn("grid auto-cols-fr grid-flow-col gap-2", className)}>
    {stats.map((stat) => (
      <div key={stat.label} className="flex min-w-0 flex-col-reverse gap-0.5">
        <dt className="font-mono text-[10px] font-medium tracking-[1px] text-muted uppercase">
          {stat.label}
        </dt>
        <dd
          className={cn(
            "truncate font-mono text-[22px] leading-7 font-bold",
            stat.className,
          )}
        >
          {stat.value}
        </dd>
      </div>
    ))}
  </dl>
);
