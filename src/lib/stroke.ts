import { Skia, type SkPath } from '@shopify/react-native-skia';

export type Point = { x: number; y: number };

export type BrushKind = 'pencil' | 'brush' | 'eraser';

export type Stroke = {
  points: Point[];
  color: string;
  /** rendered stroke width in points (fixed for the life of the stroke) */
  size: number;
  /** eraser strokes paint white to reveal the background */
  erase?: boolean;
  /**
   * Point count. While a stroke is being drawn its `points` array is mutated in
   * place (no per-move copy), so this bumps to signal "the path changed".
   * Committed strokes leave it undefined – their `points` identity is stable.
   */
  n?: number;
};

/**
 * Build a smoothed Skia path from a list of points using quadratic segments
 * through the midpoints. Handles a single tap by drawing a tiny dot.
 */
export function buildPath(points: Point[]): SkPath {
  const b = Skia.PathBuilder.Make();
  if (points.length === 0) return b.build();

  if (points.length === 1) {
    const p = points[0];
    return b.moveTo(p.x, p.y).lineTo(p.x + 0.1, p.y + 0.1).build();
  }

  b.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const c = points[i];
    const n = points[i + 1];
    b.quadTo(c.x, c.y, (c.x + n.x) / 2, (c.y + n.y) / 2);
  }
  const last = points[points.length - 1];
  b.lineTo(last.x, last.y);
  return b.build();
}

function pressureScale(pressure: number | undefined | null): number {
  if (pressure == null || pressure <= 0) return 1;
  return 0.4 + Math.min(1, pressure) * 0.9; // 0.4x .. 1.3x
}

/**
 * Fixed width for a stroke, decided once when it starts.
 * Uses stylus pressure when the pen reports it; cheap styluses report nothing,
 * so it falls back to a sensible width per tool. Keeping it fixed (no
 * speed-based taper) avoids the width "jumping" when the pen is lifted.
 */
export function computeWidth(
  kind: BrushKind,
  base: number,
  pressure?: number | null,
): number {
  if (kind === 'eraser') return base * 1.8;
  if (pressure != null && pressure > 0) {
    return base * pressureScale(pressure) * (kind === 'pencil' ? 0.62 : 1);
  }
  return base * (kind === 'pencil' ? 0.58 : 0.9);
}

/** Squared distance – cheap check for path decimation. */
export function far(a: Point, b: Point, minDist: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy >= minDist * minDist;
}
