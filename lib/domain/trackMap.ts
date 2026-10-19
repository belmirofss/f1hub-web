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
const simplifyWith = (points: Point[], tolerance: number): Point[] => {
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
  if (farthest <= tolerance) return [first, last];
  return [
    ...simplifyWith(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplifyWith(points.slice(index), tolerance),
  ];
};

const simplify = (points: Point[]) => simplifyWith(points, TOLERANCE);

const round = (n: number) => Math.round(n * 10) / 10;
const toPolyline = (points: Point[]) =>
  points.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");

// A small closed outline for thumbnails like the calendar's posters: one
// path, no sectors, whole-number coordinates. `d` starts at the start line.
export type TrackOutline = {
  width: number;
  height: number;
  d: string;
  // The start line, where `d` begins. The placeholder has none.
  start?: { x: number; y: number };
};

// The outline's longer side, and how far a dropped point may sit from it.
// A thumbnail is ~110px wide, so a unit is about a pixel and 24 outlines
// stay around 10 KB.
const OUTLINE_SIZE = 100;
const OUTLINE_TOLERANCE = 1.2;

const parsePolyline = (points: string) =>
  points
    .split(" ")
    .filter(Boolean)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    });

// A short line across the track at the start, square to the direction the
// cars set off in, `length` long in viewBox units
export const getStartLine = (map: TrackMap, length: number) => {
  const [start, ...rest] = parsePolyline(map.sectors[0]);
  const next = rest.find((p) => p.x !== start.x || p.y !== start.y);
  if (!start || !next) return null;
  const distance = Math.hypot(next.x - start.x, next.y - start.y);
  // Half the length along the normal, either side of the start
  const nx = ((start.y - next.y) / distance) * (length / 2);
  const ny = ((next.x - start.x) / distance) * (length / 2);
  return {
    x1: round(start.x - nx),
    y1: round(start.y - ny),
    x2: round(start.x + nx),
    y2: round(start.y + ny),
  };
};

// "M12 40 30 8…Z": after the move, plain pairs are lines
const toPath = (points: Point[]) =>
  `M${points.map((p) => `${Math.round(p.x)} ${Math.round(p.y)}`).join(" ")}Z`;

// Shrinks a cached track map to a thumbnail outline
export const buildOutline = (map: TrackMap): TrackOutline => {
  const scale = OUTLINE_SIZE / Math.max(map.width, map.height);
  // The sectors overlap by a point where they join, and the last one ends
  // back at the start, which the path's Z draws anyway
  const points = map.sectors
    .flatMap((sector, index) =>
      parsePolyline(sector).slice(index === 0 ? 0 : 1),
    )
    .slice(0, -1)
    .map((p) => ({ x: p.x * scale, y: p.y * scale }));
  const simplified = simplifyWith(points, OUTLINE_TOLERANCE);
  return {
    width: Math.round(map.width * scale),
    height: Math.round(map.height * scale),
    d: toPath(simplified),
    start: { x: Math.round(points[0].x), y: Math.round(points[0].y) },
  };
};

// For circuits OpenF1 has no lap of yet (new venues): a plain rounded loop,
// so the poster keeps its shape
export const PLACEHOLDER_OUTLINE: TrackOutline = {
  width: 100,
  height: 60,
  d: "M22 8H78C90 8 94 18 94 30S90 52 78 52H22C10 52 6 42 6 30S10 8 22 8Z",
};

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
