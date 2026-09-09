import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { RoundButton } from '../components/RoundButton';
import { COLORS } from '../theme';
import { deleteArtwork, exportToPhotos, listArtwork, type Artwork } from '../lib/gallery';

export function GalleryScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Artwork[]>(() => safeList());
  const [preview, setPreview] = useState<Artwork | null>(null);

  const refresh = useCallback(() => setItems(safeList()), []);
  useFocusEffect(refresh);

  const remove = (a: Artwork) => {
    Alert.alert('Bỏ bức tranh này?', '', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Bỏ',
        style: 'destructive',
        onPress: () => {
          deleteArtwork(a.name);
          setPreview(null);
          refresh();
        },
      },
    ]);
  };

  const toPhotos = async (a: Artwork) => {
    const ok = await exportToPhotos(a.uri).catch(() => false);
    Alert.alert(ok ? 'Đã lưu vào Ảnh 🎉' : 'Chưa lưu được', ok ? '' : 'Kiểm tra quyền truy cập Ảnh.');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <RoundButton label="←" onPress={onBack} />
        <Text style={styles.title}>Tranh của bé</Text>
        <View style={{ width: 64 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Chưa có tranh nào.{'\n'}Vẽ hoặc tô một bức nhé! 🎨</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.name}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <Pressable style={styles.cell} onPress={() => setPreview(item)}>
              <Image source={{ uri: item.uri }} style={styles.thumb} resizeMode="cover" />
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={!!preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      >
        <View style={styles.modalBg}>
          {preview && (
            <>
              <Image source={{ uri: preview.uri }} style={styles.big} resizeMode="contain" />
              <View style={styles.modalBtns}>
                <RoundButton label="Đóng" onPress={() => setPreview(null)} />
                <RoundButton label="Lưu vào Ảnh" tone="primary" onPress={() => toPhotos(preview)} />
                <RoundButton label="Bỏ" tone="danger" onPress={() => remove(preview)} />
              </View>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function safeList(): Artwork[] {
  try {
    return listArtwork();
  } catch {
    return [];
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.ink },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 20, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 30 },
  grid: { padding: 16, gap: 14 },
  gridRow: { gap: 14 },
  cell: {
    // flexBasis:0 + grow keeps columns equal; maxWidth stops a lone item
    // from stretching to fill the whole row.
    flexBasis: 0,
    flexGrow: 1,
    maxWidth: '31.5%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
  },
  thumb: { width: '100%', height: '100%' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  big: { width: '100%', height: '78%' },
  modalBtns: { flexDirection: 'row', gap: 14 },
});
