import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RailButton } from '../components/RailButton';
import { BrushSlider } from '../components/BrushSlider';
import { VerticalPalette } from '../components/VerticalPalette';
import { DrawSurface, type DrawSurfaceHandle } from '../components/DrawSurface';
import { Toast } from '../components/Toast';
import { BRUSH_SIZES, COLORS, DEFAULT_BRUSH_INDEX } from '../theme';
import type { BrushKind } from '../lib/stroke';
import { clearArt, createDebouncedSaver, loadArt } from '../lib/artStore';
import { exportToPhotos, saveArtwork } from '../lib/gallery';
import { playPop, playSaved, sfxStore, useSfxEnabled } from '../lib/sfx';

const DEFAULT_COLOR = '#1E88E5';
const STORE_KEY = 'freedraw';

export function FreeDrawScreen({ onBack }: { onBack: () => void }) {
  const soundOn = useSfxEnabled();
  const surface = useRef<DrawSurfaceHandle>(null);
  const saverRef = useRef<ReturnType<typeof createDebouncedSaver> | null>(null);
  if (!saverRef.current) saverRef.current = createDebouncedSaver();
  const saver = saverRef.current;
  const hydrated = useRef(false);
  const savedRev = useRef(-1);
  const savingRef = useRef(false);

  const [color, setColor] = useState(DEFAULT_COLOR);
  const [size, setSize] = useState<number>(BRUSH_SIZES[DEFAULT_BRUSH_INDEX]);
  const [tool, setTool] = useState<BrushKind>('brush');
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadArt(STORE_KEY).then((saved) => {
      if (cancelled) return;
      if (saved?.length) surface.current?.loadStrokes(saved.map((s) => ({ ...s })));
      hydrated.current = true;
    });
    return () => {
      cancelled = true;
      saver.flush();
    };
  }, [saver]);

  const onChange = useCallback(() => {
    if (!hydrated.current) return;
    saver.save(STORE_KEY, surface.current?.getStrokes() ?? []);
  }, [saver]);

  const onHistoryChange = useCallback(
    (h: { canUndo: boolean; canRedo: boolean }) => setHistory(h),
    [],
  );

  const clearAll = () => {
    if (surface.current?.isEmpty()) return;
    Alert.alert('Xoá hết?', 'Bức tranh sẽ trắng lại từ đầu.', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () => {
          surface.current?.clear();
          saver.cancel();
          clearArt(STORE_KEY);
          savedRev.current = -1;
        },
      },
    ]);
  };

  const save = async () => {
    if (savingRef.current) return;
    if (surface.current?.isEmpty() ?? true) {
      setToast('Vẽ gì đó trước nhé ✏️');
      return;
    }
    const rev = surface.current?.revision() ?? 0;
    if (rev === savedRev.current) {
      setToast('Đã lưu rồi 👍');
      return;
    }
    savingRef.current = true;
    try {
      const image = await surface.current?.snapshot();
      if (!image) {
        setToast('Chưa lưu được, thử lại');
        return;
      }
      const uri = saveArtwork(image);
      savedRev.current = rev;
      playSaved();
      const inPhotos = await exportToPhotos(uri).catch(() => false);
      setToast(inPhotos ? 'Đã lưu vào Ảnh 🎉' : 'Đã lưu vào thư viện 🎉');
    } finally {
      savingRef.current = false;
    }
  };

  const pickTool = (t: BrushKind) => {
    setTool(t);
    playPop();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        style={styles.railScroll}
        contentContainerStyle={styles.rail}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
      >
        <RailButton icon="home-variant" onPress={onBack} />
        <View style={styles.group}>
          <RailButton icon="pencil" active={tool === 'pencil'} onPress={() => pickTool('pencil')} />
          <RailButton icon="brush" active={tool === 'brush'} onPress={() => pickTool('brush')} />
          <RailButton icon="eraser" active={tool === 'eraser'} onPress={() => pickTool('eraser')} />
        </View>
        <BrushSlider size={size} onPick={setSize} color={tool === 'eraser' ? '#999' : color} />
      </ScrollView>

      <View style={styles.center}>
        <View style={styles.topBar}>
          <View style={styles.topGroup}>
            <RailButton icon="undo-variant" onPress={() => surface.current?.undo()} disabled={!history.canUndo} />
            <RailButton icon="redo-variant" onPress={() => surface.current?.redo()} disabled={!history.canRedo} />
            <RailButton icon="trash-can-outline" onPress={clearAll} disabled={!history.canUndo} />
          </View>
          <View style={styles.topGroup}>
            <RailButton icon={soundOn ? 'volume-high' : 'volume-off'} onPress={sfxStore.toggle} />
            <RailButton icon="check" tone="primary" onPress={save} />
          </View>
        </View>

        <View style={styles.canvasWrap}>
          <DrawSurface
            ref={surface}
            color={color}
            size={size}
            tool={tool}
            onChange={onChange}
            onHistoryChange={onHistoryChange}
          />
        </View>
      </View>

      <View style={styles.paletteRail}>
        <VerticalPalette
          color={color}
          onPick={(c) => {
            setColor(c);
            if (tool === 'eraser') setTool('brush');
          }}
        />
      </View>

      <Toast message={toast} onDone={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, flexDirection: 'row' },
  railScroll: { width: 92, flexGrow: 0 },
  rail: { alignItems: 'center', paddingVertical: 14, gap: 20 },
  group: { gap: 12, alignItems: 'center' },
  center: { flex: 1, paddingVertical: 12 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  topGroup: { flexDirection: 'row', gap: 10 },
  canvasWrap: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  paletteRail: { width: 84, paddingRight: 8, paddingVertical: 10 },
});
