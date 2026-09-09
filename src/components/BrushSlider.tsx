import { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BRUSH_SIZES, COLORS } from '../theme';

const TRACK_H = 208;
const TRACK_W = 12;
const LANE_W = 46;
const STEPS = BRUSH_SIZES.length;

type Props = {
  size: number;
  onPick: (s: number) => void;
  /** thumb colour preview */
  color?: string;
};

function thumbDiameter(brush: number): number {
  return Math.max(16, Math.min(36, Math.round(brush * 0.55) + 10));
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Vertical brush-size slider – drag or tap to pick one of 10 levels. */
export function BrushSlider({ size, onPick, color = COLORS.ink }: Props) {
  const idx = Math.max(0, BRUSH_SIZES.indexOf(size as (typeof BRUSH_SIZES)[number]));
  const frac = idx / (STEPS - 1); // 0 = thin (bottom), 1 = thick (top)
  const thumb = thumbDiameter(size);
  const thumbColor = color === '#FFFFFF' ? COLORS.ink : color;

  // Live values for the gesture so it is created once and never rebuilt mid-drag.
  const ref = useRef({ size, onPick });
  ref.current = { size, onPick };

  const pan = useMemo(
    () => {
      const pick = (y: number) => {
        const f = 1 - clamp(y, 0, TRACK_H) / TRACK_H;
        const next = BRUSH_SIZES[Math.round(f * (STEPS - 1))];
        if (next !== ref.current.size) ref.current.onPick(next);
      };
      return Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => pick(e.y))
        .onUpdate((e) => pick(e.y));
    },
    [],
  );

  const centerFromBottom = frac * TRACK_H;

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.lane} hitSlop={10}>
        <View style={styles.track}>
          <View style={[styles.fill, { height: clamp(centerFromBottom, TRACK_W, TRACK_H) }]} />
          {BRUSH_SIZES.map((_, i) => (
            <View
              key={i}
              style={[styles.tick, { bottom: (i / (STEPS - 1)) * (TRACK_H - 6) + 2 }]}
            />
          ))}
        </View>
        <View
          style={[
            styles.thumb,
            {
              width: thumb,
              height: thumb,
              borderRadius: thumb / 2,
              bottom: clamp(centerFromBottom - thumb / 2, 0, TRACK_H - thumb),
            },
          ]}
        >
          <View
            style={{
              width: thumb - 12,
              height: thumb - 12,
              borderRadius: (thumb - 12) / 2,
              backgroundColor: thumbColor,
            }}
          />
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  lane: { width: LANE_W, height: TRACK_H, alignItems: 'center' },
  track: {
    position: 'absolute',
    top: 0,
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_W / 2,
    backgroundColor: '#EFE6D8',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    bottom: 0,
    width: TRACK_W,
    borderRadius: TRACK_W / 2,
    backgroundColor: COLORS.coloringInk,
  },
  tick: {
    position: 'absolute',
    alignSelf: 'center',
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.55,
  },
  thumb: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: COLORS.coloringInk,
  },
});
