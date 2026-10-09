import type { TrackPoint } from "@/lib/api/types";

// A circuit outline ready for an SVG: the points are already scaled to the
// viewBox and thinned out, so the cached map is a few KB instead of the
// ~400 raw samples of a lap.
export type TrackMap = {
  width: number;
  height: number;
  // One polyline `points` string per sector, each overlapping the next by a
  // point so the coloured lines join up. The third one closes the loop.
  sectors: [string, string, string];
  start: { x: number; y: number };
};

// The longer side of the drawing, about the width of the map on a phone, and
// room around it for the 12px base line and the start marker
const SIZE = 300;
const PADDING = 10;
// How far (in viewBox units) a dropped point may sit from the simplified line
const TOLERANCE = 0.4;

type Point = { x: number; y: number };

const distanceToSegment = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length))
    : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

// Ramer–Douglas–Peucker: keeps the points that change the line's shape by
// more than the tolerance. Straights shrink to two points, corners stay.
const simplify = (points: Point[]): Point[] => {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  let farthest = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = distanceToSegment(points[i], first, last);
    if (distance > farthest) {
      farthest = distance;
      index = i;
    }
  }
  if (farthest <= TOLERANCE) return [first, last];
  return [
    ...simplify(points.slice(0, index + 1)).slice(0, -1),
    ...simplify(points.slice(index)),
  ];
};

const round = (n: number) => Math.round(n * 10) / 10;
const toPolyline = (points: Point[]) =>
  points.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");

// Fits one lap of car positions into the viewBox and splits it by sector
export const buildTrackMap = (points: TrackPoint[]): TrackMap | null => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;
  if (!spanX || !spanY) return null;

  const scale = (SIZE - PADDING * 2) / Math.max(spanX, spanY);
  const width = round(spanX * scale + PADDING * 2);
  const height = round(spanY * scale + PADDING * 2);
  // Car data has y pointing up, SVG has it pointing down
  const projected = points.map((p) => ({
    x: PADDING + (p.x - minX) * scale,
    y: height - PADDING - (p.y - minY) * scale,
  }));

  const sectors = ([0, 1, 2] as const).map((sector) => {
    const first = points.findIndex((p) => p.sector === sector);
    if (first === -1) return "";
    const last = points.findLastIndex((p) => p.sector === sector);
    const line = projected.slice(first, last + 2);
    // The lap ends where it started
    if (last === points.length - 1) line.push(projected[0]);
    return toPolyline(simplify(line));
  }) as TrackMap["sectors"];

  const [start] = projected;
  return {
    width,
    height,
    sectors,
    start: { x: round(start.x), y: round(start.y) },
  };
};
