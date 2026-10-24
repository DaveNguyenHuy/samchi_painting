import { Pressable, StyleSheet, View } from 'react-native';
import { COLORS, OPACITY_LEVELS } from '../theme';

type Props = {
  opacity: number;
  onPick: (o: number) => void;
  /** preview colour */
  color: string;
};

/** Column of dots from solid to see-through – tap one to pick the stroke opacity. */
export function OpacityPicker({ opacity, onPick, color }: Props) {
  const dotColor = color === '#FFFFFF' ? COLORS.ink : color;
  return (
    <View style={styles.col}>
      {OPACITY_LEVELS.map((o) => (
        <Pressable
          key={o}
          onPress={() => onPick(o)}
          hitSlop={3}
          style={[styles.option, o === opacity && styles.selected]}
        >
          <View style={[styles.dot, { backgroundColor: dotColor, opacity: o }]} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // kept small so the whole left rail fits a 10.5" iPad without scrolling
  col: { gap: 6, alignItems: 'center' },
  option: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selected: { borderWidth: 3, borderColor: COLORS.coloringInk, backgroundColor: '#EEEBFF' },
  dot: { width: 20, height: 20, borderRadius: 10 },
});
