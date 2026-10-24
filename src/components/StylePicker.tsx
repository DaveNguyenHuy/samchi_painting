import { useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Fill, Group } from '@shopify/react-native-skia';
import { COLORS } from '../theme';
import type { BrushEffect, Point, Stroke } from '../lib/stroke';
import { StrokePath } from './StrokeView';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export const BRUSH_STYLES: { effect?: BrushEffect; label: string; icon: IconName }[] = [
  { label: 'Thường', icon: 'brush-variant' },
  { effect: 'rainbow', label: 'Cầu vồng', icon: 'looks' },
  { effect: 'neon', label: 'Neon', icon: 'shimmer' },
  { effect: 'gradient', label: 'Chuyển màu', icon: 'gradient-horizontal' },
  { effect: 'glow', label: 'Phát sáng', icon: 'lightbulb-on' },
  { effect: 'sparkle', label: 'Lấp lánh', icon: 'creation' },
  { effect: 'glitter', label: 'Kim tuyến', icon: 'creation-outline' },
  { effect: 'crayon', label: 'Bút sáp', icon: 'format-paint' },
  { effect: 'watercolor', label: 'Màu nước', icon: 'water' },
  { effect: 'calligraphy', label: 'Thư pháp', icon: 'fountain-pen-tip' },
  { effect: 'outline', label: 'Nét viền', icon: 'circle-outline' },
  { effect: 'dots', label: 'Chấm bi', icon: 'dots-horizontal' },
  { effect: 'hearts', label: 'Trái tim', icon: 'heart' },
  { effect: 'stars', label: 'Ngôi sao', icon: 'star' },
  { effect: 'flowers', label: 'Hoa', icon: 'flower' },
  { effect: 'bubbles', label: 'Bong bóng', icon: 'chart-bubble' },
  { effect: 'lights', label: 'Dây đèn', icon: 'string-lights' },
  { effect: 'grass', label: 'Cỏ / lông', icon: 'grass' },
  { effect: 'spray', label: 'Bình xịt', icon: 'spray' },
];

export const styleIcon = (effect?: BrushEffect): IconName =>
  BRUSH_STYLES.find((s) => s.effect === effect)?.icon ?? 'brush-variant';

const TILE_W = 112;
const TILE_H = 56;
const SAMPLE_SIZE = 12;

/** A gentle wave across the tile, spaced like real input points. */
const SAMPLE_POINTS: Point[] = (() => {
  const pts: Point[] = [];
  for (let x = 16; x <= TILE_W - 16; x += 2.5) {
    pts.push({ x, y: TILE_H / 2 + Math.sin((x - 16) / 13) * 11 });
  }
  return pts;
})();

function Preview({ stroke, background }: { stroke: Stroke; background: string }) {
  return (
    <Canvas style={styles.preview}>
      <Fill color={background} />
      {/* own layer, as on the real canvas, so crayon specks show the paper */}
      <Group layer>
        <StrokePath stroke={stroke} />
      </Group>
    </Canvas>
  );
}

type Props = {
  visible: boolean;
  effect?: BrushEffect;
  color: string;
  opacity: number;
  background: string;
  onPick: (e: BrushEffect | undefined) => void;
  onClose: () => void;
};

/** Pop-up grid of brush styles, each previewed in the current colour on the current paper. */
export function StylePicker({ visible, effect, color, opacity, background, onPick, onClose }: Props) {
  const samples = useMemo(
    () =>
      BRUSH_STYLES.map(
        (s): Stroke => ({
          points: SAMPLE_POINTS,
          color,
          size: SAMPLE_SIZE,
          opacity: opacity < 1 ? opacity : undefined,
          effect: s.effect,
        }),
      ),
    [color, opacity],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* swallow taps on the card so they don't close it */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Kiểu nét</Text>
          <View style={styles.grid}>
            {BRUSH_STYLES.map((s, i) => (
              <Pressable
                key={s.label}
                hitSlop={4}
                onPress={() => {
                  onPick(s.effect);
                  onClose();
                }}
                style={[styles.tile, s.effect === effect && styles.selected]}
              >
                {visible && <Preview stroke={samples[i]} background={background} />}
                <Text style={styles.label}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 24,
    gap: 16,
    // 6 tiles a row: 6 × (112 + 2·6 padding + 2·3 border) + 5 × 12 gap = 840, + 2·24 padding
    maxWidth: 900,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.ink, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  tile: {
    padding: 6,
    gap: 4,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  selected: { borderColor: COLORS.coloringInk, backgroundColor: '#EEEBFF' },
  preview: { width: TILE_W, height: TILE_H, borderRadius: 14, overflow: 'hidden' },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.ink },
});
