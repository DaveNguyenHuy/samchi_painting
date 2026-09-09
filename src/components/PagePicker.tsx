import { useMemo } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { RailButton } from './RailButton';
import { COLORS } from '../theme';
import { PAGES, regionsFor, type ColoringPage } from '../coloring/pages';
import { PAGE_SIZE } from '../coloring/shapes';

const THUMB = 128;

function PageThumb({ page }: { page: ColoringPage }) {
  const regions = useMemo(() => regionsFor(page), [page]);
  const s = THUMB / PAGE_SIZE;
  return (
    <Canvas style={{ width: THUMB, height: THUMB }}>
      <Group transform={[{ scale: s }]}>
        {regions.map((r) =>
          r.kind === 'ink' ? (
            <Path key={r.id} path={r.path} color="#2B2B2B" />
          ) : (
            <Path
              key={r.id}
              path={r.path}
              color="#2B2B2B"
              style="stroke"
              strokeWidth={r.kind === 'line' ? 13 : 11}
              strokeJoin="round"
              strokeCap="round"
            />
          ),
        )}
      </Group>
    </Canvas>
  );
}

type Props = {
  visible: boolean;
  currentIndex: number;
  onPick: (index: number) => void;
  onClose: () => void;
};

export function PagePicker({ visible, currentIndex, onPick, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
    >
      <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Chọn tranh để tô 🎨</Text>
          <RailButton icon="close" onPress={onClose} />
        </View>
        <FlatList
          data={PAGES}
          keyExtractor={(p) => p.id}
          numColumns={5}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          initialNumToRender={15}
          windowSize={7}
          renderItem={({ item, index }) => (
            <Pressable
              style={[styles.tile, index === currentIndex && styles.tileOn]}
              onPress={() => {
                onPick(index);
                onClose();
              }}
            >
              <View style={styles.thumbBox}>
                <PageThumb page={item} />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {item.emoji} {item.title}
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
  row: { gap: 12, marginBottom: 12 },
  tile: {
    flexBasis: 0,
    flexGrow: 1,
    maxWidth: '19%',
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 3,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  tileOn: { borderColor: COLORS.coloringInk, backgroundColor: '#F0EEFF' },
  thumbBox: {
    width: THUMB,
    height: THUMB,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 12, fontWeight: '700', color: COLORS.inkSoft },
});
