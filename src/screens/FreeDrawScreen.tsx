import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RailButton } from '../components/RailButton';
import { BrushSlider } from '../components/BrushSlider';
import { VerticalPalette } from '../components/VerticalPalette';
import { OpacityPicker } from '../components/OpacityPicker';
import { BackgroundPicker } from '../components/BackgroundPicker';
import { StylePicker, styleIcon } from '../components/StylePicker';
import { DrawSurface, type DrawSurfaceHandle } from '../components/DrawSurface';
import { Toast } from '../components/Toast';
import { BRUSH_SIZES, COLORS, DEFAULT_BACKGROUND, DEFAULT_BRUSH_INDEX } from '../theme';
import type { BrushEffect, BrushKind } from '../lib/stroke';
import { RAINBOW } from '../lib/effects';
import {
  clearArt,
  createDebouncedSaver,
  loadArt,
  loadBackground,
  saveBackground,
} from '../lib/artStore';
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
  /** revision + background of the last snapshot saved to the gallery */
  const savedKey = useRef('');
  const savingRef = useRef(false);

  const [color, setColor] = useState(DEFAULT_COLOR);
  const [size, setSize] = useState<number>(BRUSH_SIZES[DEFAULT_BRUSH_INDEX]);
  const [tool, setTool] = useState<BrushKind>('brush');
  const [opacity, setOpacity] = useState(1);
  const [effect, setEffect] = useState<BrushEffect | undefined>();
  const [background, setBackground] = useState(DEFAULT_BACKGROUND);
  const [bgOpen, setBgOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadArt(STORE_KEY), loadBackground(STORE_KEY)]).then(([saved, bg]) => {
      if (cancelled) return;
      if (saved?.length) surface.current?.loadStrokes(saved.map((s) => ({ ...s })));
      if (bg) setBackground(bg);
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
          pickBackground(DEFAULT_BACKGROUND);
          savedKey.current = '';
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
    const key = `${surface.current?.revision() ?? 0}:${background}`;
    if (key === savedKey.current) {
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
      savedKey.current = key;
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

  const pickStyle = (e: BrushEffect | undefined) => {
    setEffect(e);
    if (tool === 'eraser') setTool('brush');
    playPop();
  };

  const pickOpacity = (o: number) => {
    setOpacity(o);
    if (tool === 'eraser') setTool('brush');
  };

  function pickBackground(c: string) {
    setBackground(c);
    saveBackground(STORE_KEY, c === DEFAULT_BACKGROUND ? null : c);
  }

  const erasing = tool === 'eraser';
  const activeEffect = erasing ? undefined : effect;
  const previewColor = erasing ? '#999' : activeEffect === 'rainbow' ? RAINBOW[6] : color;

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
        <BrushSlider size={size} onPick={setSize} color={previewColor} />
        <OpacityPicker opacity={erasing ? 1 : opacity} onPick={pickOpacity} color={previewColor} />
      </ScrollView>

      <View style={styles.center}>
        <View style={styles.topBar}>
          <View style={styles.topGroup}>
            <RailButton icon="undo-variant" onPress={() => surface.current?.undo()} disabled={!history.canUndo} />
            <RailButton icon="redo-variant" onPress={() => surface.current?.redo()} disabled={!history.canRedo} />
            <RailButton icon="trash-can-outline" onPress={clearAll} disabled={!history.canUndo} />
          </View>
          <View style={styles.topGroup}>
            <RailButton icon={styleIcon(activeEffect)} active={!!activeEffect} onPress={() => setStyleOpen(true)} />
            <RailButton icon="format-color-fill" onPress={() => setBgOpen(true)} />
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
            opacity={opacity}
            effect={effect}
            background={background}
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
            if (effect === 'rainbow') setEffect(undefined); // rainbow ignores the colour
          }}
        />
      </View>

      <StylePicker
        visible={styleOpen}
        effect={activeEffect}
        color={color}
        opacity={opacity}
        background={background}
        onPick={pickStyle}
        onClose={() => setStyleOpen(false)}
      />
      <BackgroundPicker
        visible={bgOpen}
        color={background}
        onPick={pickBackground}
        onClose={() => setBgOpen(false)}
      />
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
  },
  paletteRail: { width: 84, paddingRight: 8, paddingVertical: 10 },
});
