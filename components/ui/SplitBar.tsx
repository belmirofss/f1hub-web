import { cn } from "@/lib/cn";

type Props = {
  a: number;
  b: number;
  color: string;
  height?: number;
  className?: string;
};

// Head-to-head bar split by the two scores: the left driver in the team
// colour, the right one in ink, like two inks on a printed page. The numbers
// are shown next to it, so the bar itself is decorative.
export const SplitBar = ({ a, b, color, height = 8, className }: Props) => {
  const total = a + b || 1;
  // A sliver stays visible at 0 so the bar still reads as two sides
  const grow = (value: number) => Math.max(value / total, 0.03);

  return (
    <span
      aria-hidden
      className={cn("flex gap-0.5", className)}
      style={{ height }}
    >
      <span style={{ flexGrow: grow(a), backgroundColor: color }} />
      <span className="bg-text" style={{ flexGrow: grow(b) }} />
    </span>
  );
};
