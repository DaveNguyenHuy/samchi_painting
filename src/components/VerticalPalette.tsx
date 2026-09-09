import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CRAYONS } from '../theme';

type Props = {
  color: string;
  onPick: (c: string) => void;
};

export function VerticalPalette({ color, onPick }: Props) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.col}
    >
      {CRAYONS.map((c) => {
        const selected = c.toLowerCase() === color.toLowerCase();
        return (
          <Pressable key={c} onPress={() => onPick(c)} hitSlop={4}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: c },
                c === '#FFFFFF' && styles.whiteBorder,
                selected && styles.selected,
              ]}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  col: { gap: 12, alignItems: 'center', paddingVertical: 8 },
  swatch: { width: 56, height: 44, borderRadius: 22 },
  whiteBorder: { borderWidth: 2, borderColor: '#DDD' },
  selected: {
    borderWidth: 4,
    borderColor: '#1A1A1A',
    transform: [{ scale: 1.12 }],
  },
});
