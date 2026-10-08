import { cn } from "@/lib/cn";

// Finishing position per round, oldest first. 0 = did not finish, null = no entry.
export type Form = (number | null)[];

const chipClasses = (position: number | null) => {
  if (position === 1) return "border-accent bg-accent text-on-accent";
  if (position && position <= 3) return "border-text bg-text text-background";
  if (position && position <= 10)
    return "border-light-off bg-light-off text-soft";
  if (position === 0) return "border-[#5A2A24] text-loss";
  return "border-light-off text-faint";
};

const chipText = (position: number | null) =>
  position === null ? "–" : position === 0 ? "R" : String(position);

export const FormChip = ({
  position,
  size = 20,
}: {
  position: number | null;
  size?: number;
}) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center rounded-[4px] border font-mono text-[9px] font-bold",
      chipClasses(position),
    )}
    style={{ width: size, height: size }}
  >
    {chipText(position)}
  </span>
);

// Last results as small squares: win = accent, podium = white,
// points = grey, outside the points = outlined, retirement = "R".
export const FormChips = ({
  form,
  size = 20,
  className,
}: {
  form?: Form;
  size?: number;
  className?: string;
}) => {
  if (!form?.length) return null;

  const label = form
    .map((p) => (p === null ? "no entry" : p === 0 ? "retired" : `P${p}`))
    .join(", ");

  return (
    <span
      role="img"
      aria-label={`Last ${form.length} races: ${label}`}
      className={cn("flex gap-[3px]", className)}
    >
      {form.map((position, index) => (
        <FormChip key={index} position={position} size={size} />
      ))}
    </span>
  );
};

const LEGEND = [
  { position: 1, label: "Win" },
  { position: 2, label: "Podium" },
  { position: 6, label: "Points" },
  { position: 14, label: "No points" },
  { position: 0, label: "Retired (DNF)" },
];

// Explains the squares: shown once under any list that uses them
export const FormLegend = ({ className }: { className?: string }) => (
  <ul className={cn("flex flex-wrap gap-x-3 gap-y-1.5", className)}>
    {LEGEND.map((item) => (
      <li
        key={item.label}
        className="flex items-center gap-[5px] text-[11px] text-muted"
      >
        <span aria-hidden>
          <FormChip position={item.position} size={16} />
        </span>
        {item.label}
      </li>
    ))}
  </ul>
);
