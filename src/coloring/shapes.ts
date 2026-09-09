import { Skia, type SkPath } from '@shopify/react-native-skia';

/** All coloring pages are authored in this square coordinate space. */
export const PAGE_SIZE = 1000;

export function circle(cx: number, cy: number, r: number): SkPath {
  return Skia.Path.Circle(cx, cy, r);
}

export function ellipse(cx: number, cy: number, rx: number, ry: number): SkPath {
  return Skia.Path.Oval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
}

export function roundRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): SkPath {
  return Skia.Path.RRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r));
}

export function polygon(pts: [number, number][]): SkPath {
  const b = Skia.PathBuilder.Make();
  pts.forEach(([x, y], i) => {
    if (i === 0) b.moveTo(x, y);
    else b.lineTo(x, y);
  });
  return b.close().build();
}

export function fromSvg(d: string): SkPath {
  return Skia.Path.MakeFromSVGString(d) ?? Skia.PathBuilder.Make().build();
}

/** Alias – reads nicer for free-form outlines. */
export const path = fromSvg;

export function line(x1: number, y1: number, x2: number, y2: number): SkPath {
  return Skia.PathBuilder.Make().moveTo(x1, y1).lineTo(x2, y2).build();
}

export function star(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points = 5,
  rot = -Math.PI / 2,
): SkPath {
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = rot + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) b.moveTo(x, y);
    else b.lineTo(x, y);
  }
  return b.close().build();
}

export function heart(cx: number, cy: number, s: number): SkPath {
  const d =
    `M ${cx} ${cy + s * 0.95} ` +
    `C ${cx - s * 1.5} ${cy - s * 0.15}, ${cx - s * 0.75} ${cy - s * 1.05}, ${cx} ${cy - s * 0.35} ` +
    `C ${cx + s * 0.75} ${cy - s * 1.05}, ${cx + s * 1.5} ${cy - s * 0.15}, ${cx} ${cy + s * 0.95} Z`;
  return fromSvg(d);
}
