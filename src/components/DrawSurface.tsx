import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Fill,
  Group,
  type SkImage,
  type SkRect,
  useCanvasRef,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDrawing } from '../hooks/useDrawing';
import type { BrushEffect, BrushKind, Stroke } from '../lib/stroke';
import { StrokePath } from './StrokeView';

/** Only re-renders when the committed strokes array changes (not on every move). */
const CommittedLayer = React.memo(function CommittedLayer({
  strokes,
}: {
  strokes: Stroke[];
}) {
  return (
    <>
      {strokes.map((s, i) => (
        <StrokePath key={i} stroke={s} />
      ))}
    </>
  );
});

export type DrawSurfaceHandle = {
  undo(): void;
  redo(): void;
  clear(): void;
  isEmpty(): boolean;
  /** bumps on every stroke change – undo/redo/commit/clear/load */
  revision(): number;
  getStrokes(): Stroke[];
  loadStrokes(strokes: Stroke[]): void;
  snapshot(rect?: SkRect): Promise<SkImage | null>;
};

type Props = {
  color: string;
  size: number;
  tool: BrushKind;
  /** 0..1, default 1 */
  opacity?: number;
  effect?: BrushEffect;
  /** canvas colour under the paint – the eraser reveals it. Default white. */
  background?: string;
  /** Skia nodes painted on top of the strokes (e.g. colouring line art). */
  overlay?: React.ReactNode;
  /** Clip painted strokes to this rect. */
  clip?: SkRect;
  onHistoryChange?: (h: { canUndo: boolean; canRedo: boolean }) => void;
  onChange?: () => void;
};

export const DrawSurface = forwardRef<DrawSurfaceHandle, Props>(function DrawSurface(
  {
    color,
    size,
    tool,
    opacity = 1,
    effect,
    background = '#FFFFFF',
    overlay,
    clip,
    onHistoryChange,
    onChange,
  },
  ref,
) {
  const canvasRef = useCanvasRef();
  const drawing = useDrawing();
  const { begin, move, end, strokes, current, canUndo, canRedo } = drawing;

  // Gesture + imperative handle read live values through refs so they are
  // created once and never rebuilt / reallocated on a pointer move.
  const cfg = useRef({ color, size, tool, opacity, effect });
  cfg.current = { color, size, tool, opacity, effect };
  const cb = useRef({ onHistoryChange, onChange });
  cb.current = { onHistoryChange, onChange };
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;

  const revRef = useRef(0);

  useImperativeHandle(
    ref,
    (): DrawSurfaceHandle => ({
      undo: () => drawingRef.current.undo(),
      redo: () => drawingRef.current.redoLast(),
      clear: () => drawingRef.current.clear(),
      isEmpty: () => drawingRef.current.strokes.length === 0,
      revision: () => revRef.current,
      getStrokes: () => drawingRef.current.strokes,
      loadStrokes: (s) => drawingRef.current.load(s),
      snapshot: async (r?: SkRect) => {
        try {
          return (await canvasRef.current?.makeImageSnapshotAsync(r)) ?? null;
        } catch {
          return null;
        }
      },
    }),
    [canvasRef],
  );

  useEffect(() => {
    cb.current.onHistoryChange?.({ canUndo, canRedo });
  }, [canUndo, canRedo]);

  useEffect(() => {
    revRef.current += 1;
    cb.current.onChange?.();
  }, [strokes]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .maxPointers(1) // single touch – ignores extra fingers / a resting palm
        .minDistance(0)
        .averageTouches(false)
        .onBegin((e) =>
          begin({
            x: e.x,
            y: e.y,
            tool: cfg.current.tool,
            color: cfg.current.color,
            baseSize: cfg.current.size,
            opacity: cfg.current.opacity,
            effect: cfg.current.effect,
            pressure: (e as { stylusData?: { pressure?: number } }).stylusData?.pressure,
          }),
        )
        .onUpdate((e) => move(e.x, e.y))
        .onEnd(() => end())
        .onFinalize(() => end()),
    [begin, move, end],
  );

  return (
    <GestureDetector gesture={pan}>
      <View style={StyleSheet.absoluteFill}>
        <Canvas style={StyleSheet.absoluteFill} ref={canvasRef}>
          <Fill color={background} />
          {/* own layer so eraser strokes clear paint, not the background */}
          <Group clip={clip} layer>
            <CommittedLayer strokes={strokes} />
            {current && <StrokePath stroke={current} />}
          </Group>
          {overlay}
        </Canvas>
      </View>
    </GestureDetector>
  );
});
