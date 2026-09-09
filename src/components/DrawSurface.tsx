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
  Path,
  Skia,
  type SkImage,
  type SkRect,
  useCanvasRef,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDrawing } from '../hooks/useDrawing';
import { buildPath, type BrushKind, type Stroke } from '../lib/stroke';

/** Memoised – a committed stroke's object identity never changes, so it renders once. */
const StrokePath = React.memo(function StrokePath({ stroke }: { stroke: Stroke }) {
  const dot = stroke.points.length < 2;
  const path = useMemo(
    () =>
      dot
        ? Skia.Path.Circle(stroke.points[0].x, stroke.points[0].y, stroke.size / 2)
        : buildPath(stroke.points),
    [stroke.points, stroke.n, dot, stroke.size],
  );
  return (
    <Path
      path={path}
      color={stroke.erase ? '#FFFFFF' : stroke.color}
      style={dot ? 'fill' : 'stroke'}
      strokeWidth={stroke.size}
      strokeCap="round"
      strokeJoin="round"
    />
  );
});

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
  /** Skia nodes painted on top of the strokes (e.g. colouring line art). */
  overlay?: React.ReactNode;
  /** Clip painted strokes to this rect. */
  clip?: SkRect;
  onHistoryChange?: (h: { canUndo: boolean; canRedo: boolean }) => void;
  onChange?: () => void;
};

export const DrawSurface = forwardRef<DrawSurfaceHandle, Props>(function DrawSurface(
  { color, size, tool, overlay, clip, onHistoryChange, onChange },
  ref,
) {
  const canvasRef = useCanvasRef();
  const drawing = useDrawing();
  const { begin, move, end, strokes, current, canUndo, canRedo } = drawing;

  // Gesture + imperative handle read live values through refs so they are
  // created once and never rebuilt / reallocated on a pointer move.
  const cfg = useRef({ color, size, tool });
  cfg.current = { color, size, tool };
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
          <Fill color="#FFFFFF" />
          <Group clip={clip}>
            <CommittedLayer strokes={strokes} />
            {current && <StrokePath stroke={current} />}
          </Group>
          {overlay}
        </Canvas>
      </View>
    </GestureDetector>
  );
});
