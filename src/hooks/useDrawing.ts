import { useCallback, useRef, useState } from 'react';
import { computeWidth, far, type BrushKind, type Point, type Stroke } from '../lib/stroke';

/** Minimum spacing between recorded points, in screen units. */
const MIN_POINT_DIST = 2.2;
/** A stroke is split after this many points to bound the per-move path rebuild. */
const MAX_POINTS_PER_STROKE = 400;

type BeginArgs = {
  x: number;
  y: number;
  tool: BrushKind;
  color: string;
  baseSize: number;
  pressure?: number | null;
};

/**
 * Stroke state machine for the drawing / colouring canvases.
 *
 * All the moving parts live in refs so the gesture callbacks never nest one
 * setState inside another's updater (which breaks under StrictMode / concurrent
 * React and can duplicate strokes). `end()` is safe to call twice – the second
 * call from `onFinalize` is a no-op. A single tap commits as a dot.
 */
export function useDrawing() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);

  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const redoRef = useRef(redo);
  redoRef.current = redo;

  const curRef = useRef<Stroke | null>(null);
  const draftRef = useRef<Point[]>([]);
  const lastRef = useRef<Point | null>(null);
  const cfgRef = useRef<BeginArgs | null>(null);

  const startStroke = useCallback((at: Point) => {
    const cfg = cfgRef.current!;
    draftRef.current = [at];
    lastRef.current = at;
    const stroke: Stroke = {
      points: draftRef.current,
      color: cfg.color,
      size: computeWidth(cfg.tool, cfg.baseSize, cfg.pressure),
      erase: cfg.tool === 'eraser',
      n: 1,
    };
    curRef.current = stroke;
    setCurrent(stroke);
  }, []);

  const begin = useCallback(
    (args: BeginArgs) => {
      cfgRef.current = args;
      setRedo([]);
      startStroke({ x: args.x, y: args.y });
    },
    [startStroke],
  );

  const commit = useCallback((stroke: Stroke) => {
    if (stroke.points.length === 0) return;
    setStrokes((s) => [...s, stroke]);
  }, []);

  const move = useCallback(
    (x: number, y: number) => {
      const cur = curRef.current;
      if (!cur) return;
      const last = lastRef.current!;
      const pt = { x, y };
      if (!far(pt, last, MIN_POINT_DIST)) return;
      lastRef.current = pt;

      // Bound the per-move path rebuild: freeze the current stroke and keep
      // drawing a short tail from the same spot so it still looks continuous.
      if (draftRef.current.length >= MAX_POINTS_PER_STROKE) {
        commit(cur);
        draftRef.current = [last, pt];
        const next: Stroke = { ...cur, points: draftRef.current, n: 2 };
        curRef.current = next;
        setCurrent(next);
        return;
      }

      // Mutate the draft in place (points === cur.points) – no per-move copy.
      draftRef.current.push(pt);
      const updated: Stroke = { ...cur, n: draftRef.current.length };
      curRef.current = updated;
      setCurrent(updated);
    },
    [commit],
  );

  const end = useCallback(() => {
    const cur = curRef.current;
    curRef.current = null;
    draftRef.current = [];
    lastRef.current = null;
    if (!cur) return; // second call (onFinalize after onEnd) – nothing to do
    setCurrent(null);
    commit(cur);
  }, [commit]);

  const undo = useCallback(() => {
    const s = strokesRef.current;
    if (s.length === 0) return;
    setStrokes(s.slice(0, -1));
    setRedo([...redoRef.current, s[s.length - 1]]);
  }, []);

  const redoLast = useCallback(() => {
    const r = redoRef.current;
    if (r.length === 0) return;
    setRedo(r.slice(0, -1));
    setStrokes([...strokesRef.current, r[r.length - 1]]);
  }, []);

  const resetAll = useCallback((next: Stroke[]) => {
    curRef.current = null;
    draftRef.current = [];
    lastRef.current = null;
    setCurrent(null);
    setStrokes(next);
    setRedo([]);
  }, []);

  const clear = useCallback(() => resetAll([]), [resetAll]);
  const load = useCallback((next: Stroke[]) => resetAll(next), [resetAll]);

  return {
    strokes,
    current,
    canUndo: strokes.length > 0,
    canRedo: redo.length > 0,
    begin,
    move,
    end,
    undo,
    redoLast,
    clear,
    load,
  };
}
