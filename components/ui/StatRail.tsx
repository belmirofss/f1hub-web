import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

export type StatGroup = {
  // "2026" or "Career": starts the group's first label ("2026 POS",
  // "CAREER STARTS") and is read before every other one
  name: string;
  stats: { label: string; value: string | number }[];
  // On the lighter paper, like the latest season
  raised?: boolean;
};

const rail =
  "-mx-4 grid grid-cols-4 gap-px border-b border-line bg-line md:-mx-6 lg:mx-0 lg:grid-cols-8";

// The row of numbers under a PosterHero: eight cells in one row on desktop,
// four by two on phones
export const StatRail = ({ groups }: { groups: StatGroup[] }) => (
  <dl className={rail}>
    {groups.flatMap((group) =>
      group.stats.map((stat, index) => (
        <div
          key={`${group.name}-${stat.label}`}
          className={cn(
            "flex min-w-0 flex-col justify-between gap-1 px-3 py-3 lg:px-5 lg:py-[18px]",
            group.raised ? "bg-surface" : "bg-background",
          )}
        >
          {/* Wraps rather than cut "CAREER STARTS" short on a phone; the
              values stay level at the bottom of the row */}
          <dt className="font-mono text-[9px] font-medium tracking-[0.1em] text-muted uppercase lg:text-[10px] lg:tracking-[0.14em]">
            {index === 0 ? (
              `${group.name} ${stat.label}`
            ) : (
              <>
                <span className="sr-only">{group.name} </span>
                {stat.label}
              </>
            )}
          </dt>
          <dd className="truncate font-display text-[26px] leading-none font-black lg:text-4xl">
            {stat.value}
          </dd>
        </div>
      )),
    )}
  </dl>
);

export const StatRailSkeleton = () => (
  <div aria-hidden className={rail}>
    {Array.from({ length: 8 }, (_, index) => (
      <div
        key={index}
        className="flex flex-col gap-1.5 bg-background px-3 py-3 lg:px-5 lg:py-[18px]"
      >
        <Skeleton className="h-2.5 w-3/4" />
        <Skeleton className="h-[26px] w-1/2 lg:h-9" />
      </div>
    ))}
  </div>
);
