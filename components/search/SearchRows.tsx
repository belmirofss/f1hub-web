import Link from "next/link";
import { ChevronRight, Flag, Map as MapIcon } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";
import type { SearchItem, SearchType } from "@/lib/domain/search";

// Ported from the app's src/screens/Search/Search.tsx

export const OPENS: Record<SearchType, string> = {
  driver: "Driver",
  team: "Team",
  race: "Race weekend",
  circuit: "Circuit",
  season: "Season",
};

const ICONS: Partial<Record<SearchType, typeof Flag>> = {
  race: Flag,
  circuit: MapIcon,
};

const describe = (item: SearchItem) =>
  `${item.title}, ${item.subtitle}. Opens ${OPENS[item.type].toLowerCase()}`;

// Driver code, team abbreviation, '24 or an icon, with the team's colour on
// the left edge
const Badge = ({ item, large }: { item: SearchItem; large?: boolean }) => {
  const Icon = ICONS[item.type];
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-raised font-mono font-bold",
        large ? "size-11" : "size-9",
        item.type === "driver" ? "text-xs" : "text-[11px]",
      )}
    >
      {item.color && (
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: item.color }}
        />
      )}
      {Icon ? (
        <Icon size={18} strokeWidth={2} className="text-muted" />
      ) : (
        item.badge
      )}
    </span>
  );
};

type RowProps = {
  item: SearchItem;
  first?: boolean;
  onOpen: (item: SearchItem) => void;
};

export const ResultRow = ({ item, first, onOpen }: RowProps) => (
  <li>
    <Link
      href={item.href}
      onClick={() => onOpen(item)}
      aria-label={describe(item)}
      className={cn(
        "flex min-h-14 items-center gap-3 border-t px-1 py-2 transition-colors hover:bg-surface",
        first ? "border-line" : "border-line-soft",
      )}
    >
      <Badge item={item} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-bold">{item.title}</span>
        {!!item.subtitle && (
          <span className="truncate text-[13px] text-muted">
            {item.subtitle}
          </span>
        )}
      </span>
      {item.meta && (
        <span className="shrink-0 font-mono text-xs font-bold text-muted">
          {item.meta}
        </span>
      )}
      <ChevronRight
        aria-hidden
        size={16}
        strokeWidth={2}
        className="shrink-0 text-faint"
      />
    </Link>
  </li>
);

// Enter in the field opens this one
export const TopHit = ({ item, onOpen }: Omit<RowProps, "first">) => (
  <section aria-labelledby="top-hit" className="flex flex-col gap-1.5">
    <h2 id="top-hit">
      <Label>Top hit</Label>
    </h2>
    <Link
      href={item.href}
      onClick={() => onOpen(item)}
      aria-label={describe(item)}
      className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-3 transition-colors hover:border-line-dashed hover:bg-surface-raised"
    >
      <span className="flex items-center gap-3">
        <Badge item={item} large />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[22px] leading-7 font-black">
            {item.title}
          </span>
          {!!item.subtitle && (
            <span className="truncate text-[13px] text-muted">
              {item.subtitle}
            </span>
          )}
        </span>
      </span>
      <span className="flex justify-between border-t border-dashed border-line-dashed pt-2">
        <Label>Opens {OPENS[item.type]}</Label>
        <span className="font-mono text-[11px] font-bold tracking-[1px] text-accent">
          GO →
        </span>
      </span>
    </Link>
  </section>
);

export const FilterChip = ({
  label,
  count,
  on,
  onSelect,
}: {
  label: string;
  count: number;
  on: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={on}
    aria-label={`${label}, ${count} results`}
    className={cn(
      "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-3 font-mono text-xs font-bold whitespace-nowrap transition-colors",
      on
        ? "border-line-dashed bg-surface-raised text-text"
        : "border-line text-muted hover:text-text",
    )}
  >
    {label}
    <span className={cn("font-medium", on ? "text-muted" : "text-faint")}>
      {count}
    </span>
  </button>
);
