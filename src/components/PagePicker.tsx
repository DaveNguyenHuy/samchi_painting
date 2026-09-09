import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RailButton } from './RailButton';
import { COLORS } from '../theme';
import { PAGES } from '../coloring/pages';

type Props = {
  visible: boolean;
  currentIndex: number;
  onPick: (index: number) => void;
  onClose: () => void;
};

export function PagePicker({ visible, currentIndex, onPick, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Chọn tranh để tô</Text>
          <RailButton icon="close" onPress={onClose} />
        </View>
        <FlatList
          data={PAGES}
          keyExtractor={(p) => p.id}
          numColumns={5}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item, index }) => (
            <Pressable
              style={[styles.tile, index === currentIndex && styles.tileOn]}
              onPress={() => {
                onPick(index);
                onClose();
              }}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {item.title}
              </Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.ink },
  grid: { paddingBottom: 24 },
  row: { gap: 14, marginBottom: 14 },
  tile: {
    flexBasis: 0,
    flexGrow: 1,
    maxWidth: '19%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 3,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 6,
  },
  tileOn: { borderColor: COLORS.coloringInk, backgroundColor: '#F0EEFF' },
  emoji: { fontSize: 44 },
  name: { fontSize: 13, fontWeight: '700', color: COLORS.inkSoft },
});
