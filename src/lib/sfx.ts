import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const KEY = 'sfx-enabled';

let enabled = true;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let pop: AudioPlayer | null = null;
let saved: AudioPlayer | null = null;

/** Call once on app start. */
export function initSfx() {
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  try {
    pop = createAudioPlayer(require('../../assets/sfx/pop.wav'));
    pop.volume = 0.5;
    saved = createAudioPlayer(require('../../assets/sfx/saved.wav'));
    saved.volume = 0.7;
  } catch {
    // native module missing (e.g. Expo Go) – sounds just stay silent
  }
  AsyncStorage.getItem(KEY)
    .then((v) => {
      if (v != null) {
        enabled = v === '1';
        emit();
      }
    })
    .catch(() => {});
}

let lastPlay = 0;

function replay(p: AudioPlayer | null, minGapMs: number) {
  if (!enabled || !p) return;
  const now = Date.now();
  if (now - lastPlay < minGapMs) return; // don't stack rapid triggers
  lastPlay = now;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // ignore playback hiccups
  }
}

export const playPop = () => replay(pop, 110);
export const playSaved = () => replay(saved, 0);

export const sfxStore = {
  get: () => enabled,
  toggle: () => {
    enabled = !enabled;
    AsyncStorage.setItem(KEY, enabled ? '1' : '0').catch(() => {});
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useSfxEnabled(): boolean {
  return useSyncExternalStore(sfxStore.subscribe, sfxStore.get);
}
