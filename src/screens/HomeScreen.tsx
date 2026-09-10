import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { COLORS } from '../theme';

// Set per-family in app.config.ts (extra.welcome); this is the base-app default.
const WELCOME =
  (Constants.expoConfig?.extra?.welcome as string | undefined) ?? 'Chào Linh Chi & Linh Sam!';

type Props = {
  onFreeDraw: () => void;
  onColoring: () => void;
  onGallery: () => void;
};

export function HomeScreen({ onFreeDraw, onColoring, onGallery }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.hello}>{WELCOME}</Text>
        <Pressable style={styles.galleryBtn} onPress={onGallery} hitSlop={12}>
          <Text style={styles.galleryIcon}>🖼️</Text>
        </Pressable>
      </View>

      <View style={styles.cards}>
        <Pressable
          style={[styles.card, { backgroundColor: COLORS.freeDraw }]}
          onPress={onFreeDraw}
        >
          <Text style={styles.cardIcon}>🖌️</Text>
          <Text style={[styles.cardLabel, { color: COLORS.freeDrawInk }]}>Vẽ tự do</Text>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: COLORS.coloring }]}
          onPress={onColoring}
        >
          <Text style={styles.cardIcon}>🎨</Text>
          <Text style={[styles.cardLabel, { color: COLORS.coloringInk }]}>Tô màu tranh</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  hello: { fontSize: 40, fontWeight: '900', color: COLORS.ink },
  galleryBtn: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: { fontSize: 30 },
  cards: { flex: 1, flexDirection: 'row', gap: 24 },
  card: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  cardIcon: { fontSize: 96 },
  cardLabel: { fontSize: 34, fontWeight: '900' },
});
