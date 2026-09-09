import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rect } from '@shopify/react-native-skia';
import { RailButton } from '../components/RailButton';
import { BrushSlider } from '../components/BrushSlider';
import { VerticalPalette } from '../components/VerticalPalette';
import { PagePicker } from '../components/PagePicker';
import { DrawSurface, type DrawSurfaceHandle } from '../components/DrawSurface';
import { ColoringOverlay } from '../components/ColoringOverlay';
import { Toast } from '../components/Toast';
import { BRUSH_SIZES, COLORS, DEFAULT_BRUSH_INDEX } from '../theme';
import { PAGES, regionsFor } from '../coloring/pages';
import { PAGE_SIZE } from '../coloring/shapes';
import { clearArt, createDebouncedSaver, loadArt } from '../lib/artStore';
import { exportToPhotos, saveArtwork } from '../lib/gallery';
import { playPop, playSaved, sfxStore, useSfxEnabled } from '../lib/sfx';

const DEFAULT_COLOR = '#E53935';
const keyFor = (pageId: string) => `coloring:${pageId}`;

export function ColoringScreen({ onBack }: { onBack: () => void }) {
  const soundOn = useSfxEnabled();
  const surface = useRef<DrawSurfaceHandle>(null);
  const saverRef = useRef<ReturnType<typeof createDebouncedSaver> | null>(null);
  if (!saverRef.current) saverRef.current = createDebouncedSaver();
  const saver = saverRef.current;
  /** id of the page whose paint is currently loaded into the surface */
  const hydratedFor = useRef<string | null>(null);
  const savedRev = useRef(-1);
  const savingRef = useRef(false);

  const [pageIndex, setPageIndex] = useState(() => Math.floor(Math.random() * PAGES.length));
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [size, setSize] = useState<number>(BRUSH_SIZES[DEFAULT_BRUSH_INDEX]);
  const [erasing, setErasing] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const page = PAGES[pageIndex];

  const geom = useMemo(() => {
    const s = Math.min(box.w, box.h) / PAGE_SIZE || 1;
    return { scale: s, tx: (box.w - PAGE_SIZE * s) / 2, ty: (box.h - PAGE_SIZE * s) / 2 };
  }, [box]);

  const pageRect = useMemo(
    () => rect(geom.tx, geom.ty, PAGE_SIZE * geom.scale, PAGE_SIZE * geom.scale),
    [geom],
  );

  const regions = useMemo(() => regionsFor(page), [page]);

  const overlay = useMemo(
    () => (
      <ColoringOverlay
        regions={regions}
        translateX={geom.tx}
        translateY={geom.ty}
        scale={geom.scale}
      />
    ),
    [regions, geom],
  );

  // Load saved paint for the current page; block persistence until it's in.
  useEffect(() => {
    const pid = PAGES[pageIndex].id;
    hydratedFor.current = null;
    savedRev.current = -1;
    saver.cancel();
    surface.current?.loadStrokes([]);
    let cancelled = false;
    loadArt(keyFor(pid)).then((saved) => {
      if (cancelled) return;
      if (saved?.length) surface.current?.loadStrokes(saved.map((s) => ({ ...s })));
      hydratedFor.current = pid;
    });
    return () => {
      cancelled = true;
    };
  }, [pageIndex, saver]);

  useEffect(() => () => saver.flush(), [saver]);

  const onChange = useCallback(() => {
    const pid = PAGES[pageIndex].id;
    if (hydratedFor.current !== pid) return;
    saver.save(keyFor(pid), surface.current?.getStrokes() ?? []);
  }, [pageIndex, saver]);

  const onHistoryChange = useCallback(
    (h: { canUndo: boolean; canRedo: boolean }) => setHistory(h),
    [],
  );

  const goToPage = (idx: number) => {
    saver.flush();
    setPageIndex((idx + PAGES.length) % PAGES.length);
  };

  const randomPage = () => {
    if (PAGES.length < 2) return;
    let n = pageIndex;
    while (n === pageIndex) n = Math.floor(Math.random() * PAGES.length);
    playPop();
    goToPage(n);
  };

  const reset = () => {
    if (surface.current?.isEmpty()) return;
    Alert.alert('Tô lại từ đầu?', 'Xoá hết màu của bức này.', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Tô lại',
        style: 'destructive',
        onPress: () => {
          surface.current?.clear();
          saver.cancel();
          clearArt(keyFor(page.id));
          savedRev.current = -1;
        },
      },
    ]);
  };

  const save = async () => {
    if (savingRef.current) return;
    if (surface.current?.isEmpty() ?? true) {
      setToast('Tô màu gì đó trước nhé 🎨');
      return;
    }
    const rev = surface.current?.revision() ?? 0;
    if (rev === savedRev.current) {
      setToast('Đã lưu rồi 👍');
      return;
    }
    savingRef.current = true;
    try {
      const image = await surface.current?.snapshot(pageRect);
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
          <RailButton icon="view-grid" onPress={() => setPickerOpen(true)} />
          <RailButton icon="dice-5" onPress={randomPage} />
        </View>
        <View style={styles.group}>
          <RailButton icon="brush" active={!erasing} onPress={() => setErasing(false)} />
          <RailButton icon="eraser" active={erasing} onPress={() => setErasing(true)} />
        </View>
        <BrushSlider size={size} onPick={setSize} color={erasing ? '#999' : color} />
      </ScrollView>

      <View style={styles.center}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle} numberOfLines={1}>
            {page.emoji} {page.title}
          </Text>
          <View style={styles.topGroup}>
            <RailButton icon="undo-variant" onPress={() => surface.current?.undo()} disabled={!history.canUndo} />
            <RailButton icon="redo-variant" onPress={() => surface.current?.redo()} disabled={!history.canRedo} />
            <RailButton icon="refresh" onPress={reset} disabled={!history.canUndo} />
            <RailButton icon={soundOn ? 'volume-high' : 'volume-off'} onPress={sfxStore.toggle} />
            <RailButton icon="check" tone="primary" onPress={save} />
          </View>
        </View>

        <View
          style={styles.canvasWrap}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setBox({ w: width, h: height });
          }}
        >
          <DrawSurface
            ref={surface}
            color={color}
            size={size}
            tool={erasing ? 'eraser' : 'brush'}
            clip={pageRect}
            overlay={overlay}
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
            setErasing(false);
          }}
        />
      </View>

      <PagePicker
        visible={pickerOpen}
        currentIndex={pageIndex}
        onPick={goToPage}
        onClose={() => setPickerOpen(false)}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, flexDirection: 'row' },
  railScroll: { width: 92, flexGrow: 0 },
  rail: { alignItems: 'center', paddingVertical: 14, gap: 16 },
  group: { gap: 10, alignItems: 'center' },
  center: { flex: 1, paddingVertical: 12 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 10,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.ink, flexShrink: 1 },
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
