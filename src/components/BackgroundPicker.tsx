import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BACKGROUNDS, COLORS } from '../theme';

type Props = {
  visible: boolean;
  color: string;
  onPick: (c: string) => void;
  onClose: () => void;
};

/** Pop-up grid of paper colours for the canvas. */
export function BackgroundPicker({ visible, color, onPick, onClose }: Props) {
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
          <Text style={styles.title}>Màu giấy</Text>
          <View style={styles.grid}>
            {BACKGROUNDS.map((c) => (
              <Pressable
                key={c}
                hitSlop={4}
                onPress={() => {
                  onPick(c);
                  onClose();
                }}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  c.toLowerCase() === color.toLowerCase() && styles.selected,
                ]}
              />
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
    maxWidth: 560,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.ink, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  swatch: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  selected: { borderWidth: 5, borderColor: COLORS.coloringInk, transform: [{ scale: 1.08 }] },
});
