import type { TrackOutline as Outline } from "@/lib/domain/trackMap";

type Props = {
  outline: Outline;
  // Rounds still to come
  dashed?: boolean;
  strokeWidth?: number;
  // Marks the start line in the accent colour
  start?: boolean;
  className?: string;
};

// A circuit thumbnail in the current text colour. The stroke keeps its
// width whatever size the outline is drawn at.
export const TrackOutline = ({
  outline,
  dashed,
  strokeWidth = 3,
  start,
  className,
}: Props) => (
  <svg
    viewBox={`-4 -4 ${outline.width + 8} ${outline.height + 8}`}
    aria-hidden
    className={className}
  >
    <path
      d={outline.d}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeDasharray={dashed ? "4 4" : undefined}
      vectorEffect="non-scaling-stroke"
    />
    {start && outline.start && (
      <circle
        cx={outline.start.x}
        cy={outline.start.y}
        r={4}
        className="fill-accent"
      />
    )}
  </svg>
);
