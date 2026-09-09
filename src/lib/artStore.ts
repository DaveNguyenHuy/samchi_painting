import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Stroke } from './stroke';

/** What we persist – a stroke without its rebuilt SkPath. */
export type SavedStroke = Pick<Stroke, 'points' | 'color' | 'size' | 'erase'>;

const storageKey = (key: string) => `art:${key}`;

function slim(strokes: SavedStroke[]): SavedStroke[] {
  return strokes.map((s) => ({
    points: s.points,
    color: s.color,
    size: Math.round(s.size),
    erase: s.erase,
  }));
}

export async function loadArt(key: string): Promise<SavedStroke[] | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedStroke[]) : null;
  } catch {
    return null;
  }
}

export function saveArt(key: string, strokes: SavedStroke[]): void {
  AsyncStorage.setItem(storageKey(key), JSON.stringify(slim(strokes))).catch(() => {});
}

export function clearArt(key: string): void {
  AsyncStorage.removeItem(storageKey(key)).catch(() => {});
}

/**
 * Coalesces rapid changes into a single write. `flush()` writes any pending
 * change immediately (call it on unmount / before navigating away).
 */
export function createDebouncedSaver(delayMs = 700) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { key: string; strokes: SavedStroke[] } | null = null;

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending) {
      saveArt(pending.key, pending.strokes);
      pending = null;
    }
  };

  return {
    save(key: string, strokes: SavedStroke[]) {
      pending = { key, strokes };
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    /** Drop a pending write without saving (e.g. the page was reset). */
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      pending = null;
    },
    flush,
  };
}
