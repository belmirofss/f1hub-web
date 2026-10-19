import { Suspense } from "react";
import { getCircuitOutline } from "@/lib/circuitOutlines";
import {
  PLACEHOLDER_OUTLINE,
  type TrackOutline as Outline,
} from "@/lib/domain/trackMap";

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

type CircuitProps = Omit<Props, "outline"> & { circuitId: string };

const LoadedOutline = async ({ circuitId, ...props }: CircuitProps) => (
  <TrackOutline outline={await getCircuitOutline(circuitId)} {...props} />
);

// A circuit's outline, loaded on its own. Once cached it arrives with the
// page; on a cold cache (two OpenF1 requests per circuit, at 30 a minute)
// the placeholder loop stands in and each outline streams in when ready.
export const CircuitOutline = ({ circuitId, ...props }: CircuitProps) => (
  <Suspense
    fallback={<TrackOutline outline={PLACEHOLDER_OUTLINE} {...props} />}
  >
    <LoadedOutline circuitId={circuitId} {...props} />
  </Suspense>
);
