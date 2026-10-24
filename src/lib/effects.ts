import { Skia, type SkPath } from '@shopify/react-native-skia';
import type { Point } from './stroke';

type Builder = ReturnType<typeof Skia.PathBuilder.Make>;

export const RAINBOW = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#3949AB', '#8E24AA'];

/** Small deterministic PRNG so scattered bits stay put when the stroke re-renders. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Called for each stamp: position, running index, and the unit direction of travel. */
type Place = (x: number, y: number, i: number, tx: number, ty: number) => void;

/**
 * Calls `place` at the start of the stroke and then every `step` along it.
 * Placement depends only on the distance walked from the first point, so
 * stamps already placed never move while the stroke is still being drawn.
 */
function walk(points: Point[], step: number, place: Place) {
  if (points.length === 0) return;
  let i = 0;
  const first = points[0];
  const second = points[1];
  const len0 = second ? Math.hypot(second.x - first.x, second.y - first.y) : 0;
  place(first.x, first.y, i++, len0 ? (second.x - first.x) / len0 : 1, len0 ? (second.y - first.y) / len0 : 0);
  let next = step;
  let dist = 0;
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1];
    const b = points[k];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    while (dist + len >= next) {
      const t = len === 0 ? 0 : (next - dist) / len;
      const tx = len === 0 ? 1 : (b.x - a.x) / len;
      const ty = len === 0 ? 0 : (b.y - a.y) / len;
      place(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, i++, tx, ty);
      next += step;
    }
    dist += len;
  }
}

/**
 * Split a stroke into `count` polylines, cycling which one each piece goes to
 * by distance travelled (every `band` points). A banded stroke is always a
 * fixed handful of draws however long it gets.
 */
function bandPaths(points: Point[], size: number, count: number, band: number): SkPath[] {
  const builders = Array.from({ length: count }, () => Skia.PathBuilder.Make());
  if (points.length === 1) builders[0].addCircle(points[0].x, points[0].y, size / 2);

  let dist = 0;
  let prevBucket = -1;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const bucket = Math.floor(dist / band) % count;
    // Each run starts a new sub-path at the previous point; its round cap
    // overlaps the end of the previous run so there is no gap.
    if (bucket !== prevBucket) builders[bucket].moveTo(a.x, a.y);
    builders[bucket].lineTo(b.x, b.y);
    prevBucket = bucket;
    dist += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return builders.map((b) => b.build());
}

/** One path per `RAINBOW` colour. */
export const rainbowPaths = (points: Point[], size: number) =>
  bandPaths(points, size, RAINBOW.length, Math.max(18, size * 1.2));

function addStar(b: Builder, cx: number, cy: number, r: number) {
  b.moveTo(cx, cy - r)
    .quadTo(cx, cy, cx + r, cy)
    .quadTo(cx, cy, cx, cy + r)
    .quadTo(cx, cy, cx - r, cy)
    .quadTo(cx, cy, cx, cy - r)
    .close();
}

/** Four-point stars scattered along a stroke: [white stars, gold stars]. */
export function sparklePaths(points: Point[], size: number): [SkPath, SkPath] {
  const white = Skia.PathBuilder.Make();
  const gold = Skia.PathBuilder.Make();
  const maxR = Math.max(5, size * 0.55);
  walk(points, Math.max(14, size * 0.9), (x, y, i) => {
    const angle = rand(i) * Math.PI * 2;
    const off = rand(i + 0.5) * size * 0.6;
    const r = maxR * (0.45 + rand(i + 0.25) * 0.55);
    addStar(i % 3 === 2 ? gold : white, x + Math.cos(angle) * off, y + Math.sin(angle) * off, r);
  });
  return [white.build(), gold.build()];
}

/** Evenly spaced round dots. */
export function dotPaths(points: Point[], size: number): SkPath {
  const b = Skia.PathBuilder.Make();
  const r = Math.max(2, size / 2);
  walk(points, Math.max(8, size * 1.5), (x, y) => b.addCircle(x, y, r));
  return b.build();
}

/** Little hearts along the stroke, each tilted a bit differently. */
export function heartPaths(points: Point[], size: number): SkPath {
  const b = Skia.PathBuilder.Make();
  const s = Math.max(10, size * 1.3);
  walk(points, s * 1.25, (cx, cy, i) => {
    const a = (rand(i) - 0.5) * 0.7;
    const cos = Math.cos(a) * s;
    const sin = Math.sin(a) * s;
    // unit heart (width ≈ 1) rotated by `a`, scaled by `s`
    const X = (x: number, y: number) => cx + x * cos - y * sin;
    const Y = (x: number, y: number) => cy + x * sin + y * cos;
    b.moveTo(X(0, 0.45), Y(0, 0.45))
      .cubicTo(X(-0.6, 0.05), Y(-0.6, 0.05), X(-0.5, -0.5), Y(-0.5, -0.5), X(0, -0.18), Y(0, -0.18))
      .cubicTo(X(0.5, -0.5), Y(0.5, -0.5), X(0.6, 0.05), Y(0.6, 0.05), X(0, 0.45), Y(0, 0.45))
      .close();
  });
  return b.build();
}

/** Random specks inside a disc around the stroke, like spray paint. */
export function sprayPaths(points: Point[], size: number): SkPath {
  const b = Skia.PathBuilder.Make();
  const R = Math.max(6, size * 0.9);
  const dotR = Math.max(0.8, size * 0.05);
  walk(points, Math.max(3, size * 0.25), (x, y, i) => {
    for (let k = 0; k < 5; k++) {
      const s = i * 5 + k;
      const angle = rand(s) * Math.PI * 2;
      const d = Math.sqrt(rand(s + 0.3)) * R; // sqrt → even density over the disc
      b.addCircle(x + Math.cos(angle) * d, y + Math.sin(angle) * d, dotR * (0.6 + rand(s + 0.6)));
    }
  });
  return b.build();
}

/** Tiny gaps punched into a crayon stroke so it looks waxy and grainy. */
export function crayonHoles(points: Point[], size: number): SkPath {
  const b = Skia.PathBuilder.Make();
  const R = size * 0.5;
  const holeR = Math.max(0.6, size * 0.06);
  walk(points, Math.max(2, size * 0.35), (x, y, i) => {
    for (let k = 0; k < 3; k++) {
      const s = i * 3 + k;
      const angle = rand(s) * Math.PI * 2;
      const d = Math.sqrt(rand(s + 0.3)) * R;
      b.addCircle(x + Math.cos(angle) * d, y + Math.sin(angle) * d, holeR * (0.5 + rand(s + 0.6)));
    }
  });
  return b.build();
}

// ── colour helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** The colour `deg` degrees round the colour wheel from `hex` (same lightness). */
function shiftHue(hex: string, deg: number): string {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d < 0.08) return '#EC407A'; // black / white / grey have no hue – blend into pink
  const sat = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + deg + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

// ── more stamp / band styles ──────────────────────────────────────────────────

const GRADIENT_STEPS = 12;

/** Colours for a gradient stroke: from `hex` to its hue-shifted partner and back. */
export function gradientColors(hex: string): string[] {
  const other = shiftHue(hex, 80);
  return Array.from({ length: GRADIENT_STEPS }, (_, i) => {
    const t = i < GRADIENT_STEPS / 2 ? (2 * i) / GRADIENT_STEPS : (2 * (GRADIENT_STEPS - i)) / GRADIENT_STEPS;
    return mix(hex, other, t);
  });
}

/** One path per `gradientColors` entry. */
export const gradientPaths = (points: Point[], size: number) =>
  bandPaths(points, size, GRADIENT_STEPS, Math.max(6, size * 0.5));

function addFivePointStar(b: Builder, cx: number, cy: number, r: number, rot: number) {
  for (let k = 0; k < 10; k++) {
    const rr = k % 2 === 0 ? r : r * 0.45;
    const a = rot - Math.PI / 2 + (k * Math.PI) / 5;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (k === 0) b.moveTo(x, y);
    else b.lineTo(x, y);
  }
  b.close();
}

/** Five-point stars of varying size and tilt. */
export function starPaths(points: Point[], size: number): SkPath {
  const b = Skia.PathBuilder.Make();
  const s = Math.max(8, size * 0.9);
  walk(points, s * 1.6, (x, y, i) =>
    addFivePointStar(b, x, y, s * (0.6 + rand(i) * 0.5), (rand(i + 0.5) - 0.5) * 0.8),
  );
  return b.build();
}

/** Bubbles of mixed sizes: [rims, shine spots]. */
export function bubblePaths(points: Point[], size: number): [SkPath, SkPath] {
  const rims = Skia.PathBuilder.Make();
  const shine = Skia.PathBuilder.Make();
  const s = Math.max(8, size);
  walk(points, s * 1.1, (x, y, i) => {
    const r = s * (0.35 + rand(i) * 0.65);
    const a = rand(i + 0.3) * Math.PI * 2;
    const off = rand(i + 0.6) * size * 0.5;
    const cx = x + Math.cos(a) * off;
    const cy = y + Math.sin(a) * off;
    rims.addCircle(cx, cy, r);
    shine.addCircle(cx - r * 0.38, cy - r * 0.38, Math.max(1.2, r * 0.18));
  });
  return [rims.build(), shine.build()];
}

/** Five-petal flowers: [petals, centres]. */
export function flowerPaths(points: Point[], size: number): [SkPath, SkPath] {
  const petals = Skia.PathBuilder.Make();
  const centres = Skia.PathBuilder.Make();
  const s = Math.max(10, size * 1.2);
  walk(points, s * 2.2, (x, y, i) => {
    const k = 0.7 + rand(i) * 0.5;
    const rot = rand(i + 0.5) * Math.PI;
    for (let p = 0; p < 5; p++) {
      const a = rot + (p * Math.PI * 2) / 5;
      petals.addCircle(x + Math.cos(a) * s * 0.5 * k, y + Math.sin(a) * s * 0.5 * k, s * 0.42 * k);
    }
    centres.addCircle(x, y, s * 0.3 * k);
  });
  return [petals.build(), centres.build()];
}

export const LIGHT_COLORS = ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB', '#FFAB40'];

/** Bulbs hanging off alternate sides of a wire, one path per `LIGHT_COLORS` entry. */
export function lightBulbPaths(points: Point[], size: number): SkPath[] {
  const builders = LIGHT_COLORS.map(() => Skia.PathBuilder.Make());
  const r = Math.max(4, size * 0.45);
  walk(points, Math.max(18, size * 2), (x, y, i, tx, ty) => {
    const side = i % 2 === 0 ? 1 : -1;
    // normal to the wire
    const nx = -ty * side;
    const ny = tx * side;
    builders[i % LIGHT_COLORS.length].addCircle(x + nx * r * 0.9, y + ny * r * 0.9, r);
  });
  return builders.map((b) => b.build());
}

/** Short strands sprouting from both sides of the stroke – grass or fur. */
export function grassPaths(points: Point[], size: number): SkPath {
  const b = Skia.PathBuilder.Make();
  const base = Math.max(6, size);
  walk(points, Math.max(2.5, size * 0.22), (x, y, i, tx, ty) => {
    for (const side of [1, -1]) {
      const s = i * 2 + (side > 0 ? 0 : 1);
      const len = base * (0.5 + rand(s) * 0.6);
      const lean = (rand(s + 0.4) - 0.5) * 0.8;
      const nx = -ty * side + tx * lean;
      const ny = tx * side + ty * lean;
      const sx = x + nx * size * 0.2;
      const sy = y + ny * size * 0.2;
      b.moveTo(sx, sy).lineTo(sx + nx * len, sy + ny * len);
    }
  });
  return b.build();
}

export const GLITTER_COLORS = ['#FFD54F', '#E0E0E0', '#F48FB1', '#80DEEA', '#CE93D8'];

/**
 * Metallic specks: one path per colour (the stroke colour first, then
 * `GLITTER_COLORS`), plus a path of small white twinkles.
 */
export function glitterPaths(points: Point[], size: number): { specks: SkPath[]; twinkles: SkPath } {
  const specks = Array.from({ length: GLITTER_COLORS.length + 1 }, () => Skia.PathBuilder.Make());
  const twinkles = Skia.PathBuilder.Make();
  const R = Math.max(5, size * 0.6);
  const dotR = Math.max(0.9, size * 0.07);
  walk(points, Math.max(2.5, size * 0.2), (x, y, i) => {
    for (let k = 0; k < 4; k++) {
      const s = i * 4 + k;
      const a = rand(s) * Math.PI * 2;
      const d = Math.sqrt(rand(s + 0.3)) * R;
      specks[s % specks.length].addCircle(x + Math.cos(a) * d, y + Math.sin(a) * d, dotR * (0.6 + rand(s + 0.6)));
    }
    if (i % 6 === 3) addStar(twinkles, x, y, Math.max(3, size * 0.3));
  });
  return { specks: specks.map((b) => b.build()), twinkles: twinkles.build() };
}

/**
 * A flat-nib pen held at 45°: each segment sweeps the nib into a
 * parallelogram, so strokes are thick one way and thin the other.
 */
export function calligraphyPath(points: Point[], size: number): SkPath {
  const b = Skia.PathBuilder.Make();
  const nx = Math.SQRT1_2 * size * 0.6;
  const ny = -Math.SQRT1_2 * size * 0.6;
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1];
    const c = points[k];
    const quad: [number, number][] = [
      [a.x - nx, a.y - ny],
      [c.x - nx, c.y - ny],
      [c.x + nx, c.y + ny],
      [a.x + nx, a.y + ny],
    ];
    // Wind every piece the same way so the non-zero fill unions them
    // instead of cancelling where they overlap.
    const cross = (c.x - a.x) * (2 * ny) - (c.y - a.y) * (2 * nx);
    if (cross < 0) quad.reverse();
    quad.forEach(([x, y], i) => (i === 0 ? b.moveTo(x, y) : b.lineTo(x, y)));
    b.close();
  }
  return b.build();
}
