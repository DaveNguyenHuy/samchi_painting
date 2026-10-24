import React, { useMemo } from 'react';
import { BlurMask, Group, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import {
  GLITTER_COLORS,
  LIGHT_COLORS,
  RAINBOW,
  bubblePaths,
  calligraphyPath,
  crayonHoles,
  dotPaths,
  flowerPaths,
  glitterPaths,
  gradientColors,
  gradientPaths,
  grassPaths,
  heartPaths,
  lightBulbPaths,
  rainbowPaths,
  sparklePaths,
  sprayPaths,
  starPaths,
} from '../lib/effects';
import { buildPath, type Point, type Stroke } from '../lib/stroke';

const ROUND = { strokeCap: 'round', strokeJoin: 'round' } as const;

type PathStyle = 'fill' | 'stroke';
type EffectProps = { stroke: Stroke; path: SkPath; style: PathStyle };

/**
 * A paint that composites a whole group at once, so its overlapping parts
 * don't double up when the stroke is see-through. Undefined when opaque.
 */
function useAlphaLayer(opacity: number | undefined) {
  return useMemo(() => {
    if (opacity == null) return undefined;
    const paint = Skia.Paint();
    paint.setAlphaf(opacity);
    return paint;
  }, [opacity]);
}

/** Memoise an effect's geometry on the stroke's points (and live point count). */
function useGeometry<T>(stroke: Stroke, build: (points: Point[], size: number) => T): T {
  return useMemo(() => build(stroke.points, stroke.size), [stroke.points, stroke.n, stroke.size]);
}

/** Memoised – a committed stroke's object identity never changes, so it renders once. */
export const StrokePath = React.memo(function StrokePath({ stroke }: { stroke: Stroke }) {
  const dot = stroke.points.length < 2;
  const path = useMemo(
    () =>
      dot
        ? Skia.Path.Circle(stroke.points[0].x, stroke.points[0].y, stroke.size / 2)
        : buildPath(stroke.points),
    [stroke.points, stroke.n, dot, stroke.size],
  );
  const style: PathStyle = dot ? 'fill' : 'stroke';

  if (stroke.erase) {
    // Cuts through the paint layer to whatever background is underneath.
    return <Path path={path} blendMode="clear" style={style} strokeWidth={stroke.size} {...ROUND} />;
  }
  switch (stroke.effect) {
    case 'rainbow':
      return <BandedStroke stroke={stroke} colors={RAINBOW} build={rainbowPaths} />;
    case 'sparkle':
      return <SparkleStroke stroke={stroke} path={path} style={style} />;
    case 'glow':
      return <GlowStroke stroke={stroke} path={path} style={style} />;
    case 'crayon':
      return <CrayonStroke stroke={stroke} path={path} style={style} />;
    case 'outline':
      return <OutlineStroke stroke={stroke} path={path} style={style} />;
    case 'dots':
      return <StampStroke stroke={stroke} build={dotPaths} />;
    case 'hearts':
      return <StampStroke stroke={stroke} build={heartPaths} />;
    case 'spray':
      return <StampStroke stroke={stroke} build={sprayPaths} />;
    case 'stars':
      return <StampStroke stroke={stroke} build={starPaths} />;
    case 'bubbles':
      return <BubbleStroke stroke={stroke} />;
    case 'flowers':
      return <FlowerStroke stroke={stroke} />;
    case 'lights':
      return <LightsStroke stroke={stroke} path={path} style={style} />;
    case 'grass':
      return <GrassStroke stroke={stroke} path={path} style={style} />;
    case 'glitter':
      return <GlitterStroke stroke={stroke} />;
    case 'watercolor':
      return <WatercolorStroke stroke={stroke} path={path} style={style} />;
    case 'gradient':
      return <GradientStroke stroke={stroke} />;
    case 'neon':
      return <NeonRainbowStroke stroke={stroke} path={path} style={style} />;
    case 'calligraphy':
      return <CalligraphyStroke stroke={stroke} path={path} style={style} />;
    default:
      return (
        <Path
          path={path}
          color={stroke.color}
          opacity={stroke.opacity}
          style={style}
          strokeWidth={stroke.size}
          {...ROUND}
        />
      );
  }
});

/** Stroke drawn in alternating colour runs (rainbow). */
function BandedStroke({
  stroke,
  colors,
  build,
}: {
  stroke: Stroke;
  colors: string[];
  build: (points: Point[], size: number) => SkPath[];
}) {
  const paths = useGeometry(stroke, build);
  const layer = useAlphaLayer(stroke.opacity);
  const style: PathStyle = stroke.points.length < 2 ? 'fill' : 'stroke';
  return (
    <Group layer={layer}>
      {paths.map((p, i) => (
        <Path key={i} path={p} color={colors[i]} style={style} strokeWidth={stroke.size} {...ROUND} />
      ))}
    </Group>
  );
}

/** Filled shapes placed along the stroke instead of a line (dots, hearts, spray). */
function StampStroke({
  stroke,
  build,
}: {
  stroke: Stroke;
  build: (points: Point[], size: number) => SkPath;
}) {
  const path = useGeometry(stroke, build);
  return <Path path={path} color={stroke.color} opacity={stroke.opacity} />;
}

function SparkleStroke({ stroke, path, style }: EffectProps) {
  const [white, gold] = useGeometry(stroke, sparklePaths);
  return (
    <Group opacity={stroke.opacity}>
      <Path path={path} color={stroke.color} style={style} strokeWidth={stroke.size} {...ROUND} />
      <Path path={white} color="#FFFFFF" />
      <Path path={gold} color="#FFD54F" />
    </Group>
  );
}

function GlowStroke({ stroke, path, style }: EffectProps) {
  return (
    <Group opacity={stroke.opacity}>
      <Path path={path} color={stroke.color} style={style} strokeWidth={stroke.size * 1.8} {...ROUND}>
        <BlurMask blur={Math.max(4, stroke.size * 0.6)} style="normal" />
      </Path>
      <Path path={path} color={stroke.color} style={style} strokeWidth={stroke.size} {...ROUND} />
      <Path
        path={path}
        color="#FFFFFF"
        opacity={0.85}
        style={style}
        strokeWidth={Math.max(1.5, stroke.size * 0.35)}
        {...ROUND}
      />
    </Group>
  );
}

function CrayonStroke({ stroke, path, style }: EffectProps) {
  const holes = useGeometry(stroke, crayonHoles);
  return (
    <Group opacity={stroke.opacity}>
      <Path path={path} color={stroke.color} style={style} strokeWidth={stroke.size} {...ROUND} />
      {/* knock the specks out of the paint layer so the paper shows through */}
      <Path path={holes} color="#000000" blendMode="dstOut" />
    </Group>
  );
}

/** A hollow tube: the colour as a rim around a white core. */
function OutlineStroke({ stroke, path, style }: EffectProps) {
  const layer = useAlphaLayer(stroke.opacity);
  return (
    <Group layer={layer}>
      <Path path={path} color={stroke.color} style={style} strokeWidth={stroke.size} {...ROUND} />
      <Path
        path={path}
        color="#FFFFFF"
        style={style}
        strokeWidth={Math.max(1, stroke.size * 0.45)}
        {...ROUND}
      />
    </Group>
  );
}

function BubbleStroke({ stroke }: { stroke: Stroke }) {
  const [rims, shine] = useGeometry(stroke, bubblePaths);
  return (
    <Group opacity={stroke.opacity}>
      <Path path={rims} color={stroke.color} opacity={0.18} />
      <Path path={rims} color={stroke.color} style="stroke" strokeWidth={Math.max(1.5, stroke.size * 0.12)} />
      <Path path={shine} color="#FFFFFF" />
    </Group>
  );
}

function FlowerStroke({ stroke }: { stroke: Stroke }) {
  const [petals, centres] = useGeometry(stroke, flowerPaths);
  return (
    <Group opacity={stroke.opacity}>
      <Path path={petals} color={stroke.color} />
      <Path path={centres} color="#FFD54F" />
    </Group>
  );
}

/** A wire in the stroke colour with glowing coloured bulbs. */
function LightsStroke({ stroke, path, style }: EffectProps) {
  const bulbs = useGeometry(stroke, lightBulbPaths);
  const r = Math.max(4, stroke.size * 0.45);
  return (
    <Group opacity={stroke.opacity}>
      <Path path={path} color={stroke.color} style={style} strokeWidth={Math.max(1.5, stroke.size * 0.12)} {...ROUND} />
      {bulbs.map((p, i) => (
        <Group key={i}>
          <Path path={p} color={LIGHT_COLORS[i]} opacity={0.6}>
            <BlurMask blur={r * 0.8} style="normal" />
          </Path>
          <Path path={p} color={LIGHT_COLORS[i]} />
        </Group>
      ))}
    </Group>
  );
}

function GrassStroke({ stroke, path, style }: EffectProps) {
  const strands = useGeometry(stroke, grassPaths);
  return (
    <Group opacity={stroke.opacity}>
      <Path path={path} color={stroke.color} style={style} strokeWidth={stroke.size * 0.5} {...ROUND} />
      <Path
        path={strands}
        color={stroke.color}
        style="stroke"
        strokeWidth={Math.max(1, stroke.size * 0.1)}
        strokeCap="round"
      />
    </Group>
  );
}

function GlitterStroke({ stroke }: { stroke: Stroke }) {
  const { specks, twinkles } = useGeometry(stroke, glitterPaths);
  const colors = [stroke.color, ...GLITTER_COLORS];
  return (
    <Group opacity={stroke.opacity}>
      {specks.map((p, i) => (
        <Path key={i} path={p} color={colors[i]} />
      ))}
      <Path path={twinkles} color="#FFFFFF" />
    </Group>
  );
}

/** Soft, see-through paint with blurred edges; overlapping strokes build up. */
function WatercolorStroke({ stroke, path, style }: EffectProps) {
  return (
    <Path
      path={path}
      color={stroke.color}
      opacity={(stroke.opacity ?? 1) * 0.55}
      style={style}
      strokeWidth={stroke.size * 1.2}
      {...ROUND}
    >
      <BlurMask blur={Math.max(2, stroke.size * 0.3)} style="normal" />
    </Path>
  );
}

function GradientStroke({ stroke }: { stroke: Stroke }) {
  const colors = useMemo(() => gradientColors(stroke.color), [stroke.color]);
  return <BandedStroke stroke={stroke} colors={colors} build={gradientPaths} />;
}

/** Rainbow bands with a glow round each and a white-hot core. */
function NeonRainbowStroke({ stroke, path, style }: EffectProps) {
  const bands = useGeometry(stroke, rainbowPaths);
  const bandStyle: PathStyle = stroke.points.length < 2 ? 'fill' : 'stroke';
  return (
    <Group opacity={stroke.opacity}>
      {bands.map((p, i) => (
        <Path key={i} path={p} color={RAINBOW[i]} style={bandStyle} strokeWidth={stroke.size * 1.8} {...ROUND}>
          <BlurMask blur={Math.max(4, stroke.size * 0.6)} style="normal" />
        </Path>
      ))}
      {bands.map((p, i) => (
        <Path key={`c${i}`} path={p} color={RAINBOW[i]} style={bandStyle} strokeWidth={stroke.size} {...ROUND} />
      ))}
      <Path
        path={path}
        color="#FFFFFF"
        opacity={0.85}
        style={style}
        strokeWidth={Math.max(1.5, stroke.size * 0.3)}
        {...ROUND}
      />
    </Group>
  );
}

function CalligraphyStroke({ stroke, path, style }: EffectProps) {
  const nib = useGeometry(stroke, calligraphyPath);
  return (
    <Group opacity={stroke.opacity}>
      <Path path={nib} color={stroke.color} />
      {/* thin hairline so strokes along the nib's edge don't vanish */}
      <Path path={path} color={stroke.color} style={style} strokeWidth={Math.max(1.5, stroke.size * 0.12)} {...ROUND} />
    </Group>
  );
}
