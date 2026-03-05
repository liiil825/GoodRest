import { create } from 'zustand';
import { DEFAULT_INTERVAL_MINUTES, DEFAULT_REST_SECONDS, DEFAULT_BIG_REST_SECONDS } from '../lib/constants';

interface SettingsState {
  // Time settings
  intervalMinutes: number;
  restSeconds: number;
  bigTomatoRestSeconds: number;

  // Timer state
  isPaused: boolean;
  nextReminderSeconds: number | null;
  workMode: 'working' | 'resting' | 'big_resting';

  // Tomato counts
  smallTomatoCount: number;
  bigTomatoCount: number;

  // Sound settings - 3 independent sounds
  workSoundEnabled: boolean;
  smallRestSoundEnabled: boolean;
  bigRestSoundEnabled: boolean;
  soundFilePath: string | null;

  // Audio file existence
  workAudioSet: boolean;
  smallRestAudioSet: boolean;
  bigRestAudioSet: boolean;

  // UI state
  notification: string | null;
  currentPage: 'home' | 'settings';

  // Actions
  setInterval: (minutes: number) => void;
  setRestSeconds: (seconds: number) => void;
  setBigTomatoRestSeconds: (seconds: number) => void;
  setIsPaused: (paused: boolean) => void;
  setNextReminderSeconds: (seconds: number | null) => void;
  setWorkMode: (mode: 'working' | 'resting' | 'big_resting') => void;
  setSmallTomatoCount: (count: number) => void;
  setBigTomatoCount: (count: number) => void;
  setWorkSoundEnabled: (enabled: boolean) => void;
  setSmallRestSoundEnabled: (enabled: boolean) => void;
  setBigRestSoundEnabled: (enabled: boolean) => void;
  setSoundFilePath: (path: string | null) => void;
  setWorkAudioSet: (value: boolean) => void;
  setSmallRestAudioSet: (value: boolean) => void;
  setBigRestAudioSet: (value: boolean) => void;
  setNotification: (message: string | null) => void;
  setCurrentPage: (page: 'home' | 'settings') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // Time settings
  intervalMinutes: DEFAULT_INTERVAL_MINUTES,
  restSeconds: DEFAULT_REST_SECONDS,
  bigTomatoRestSeconds: DEFAULT_BIG_REST_SECONDS,

  // Timer state
  isPaused: false,
  nextReminderSeconds: null,
  workMode: 'working',

  // Tomato counts
  smallTomatoCount: 0,
  bigTomatoCount: 0,

  // Sound settings
  workSoundEnabled: true,
  smallRestSoundEnabled: true,
  bigRestSoundEnabled: true,
  soundFilePath: null,

  // Audio file existence
  workAudioSet: false,
  smallRestAudioSet: false,
  bigRestAudioSet: false,

  // UI state
  notification: null,
  currentPage: 'home',

  // Actions
  setInterval: (minutes: number) => set({ intervalMinutes: minutes }),
  setRestSeconds: (seconds: number) => set({ restSeconds: seconds }),
  setBigTomatoRestSeconds: (seconds: number) => set({ bigTomatoRestSeconds: seconds }),
  setIsPaused: (paused: boolean) => set({ isPaused: paused }),
  setNextReminderSeconds: (seconds: number | null) => set({ nextReminderSeconds: seconds }),
  setWorkMode: (mode: 'working' | 'resting' | 'big_resting') => set({ workMode: mode }),
  setSmallTomatoCount: (count: number) => set({ smallTomatoCount: count }),
  setBigTomatoCount: (count: number) => set({ bigTomatoCount: count }),
  setWorkSoundEnabled: (enabled: boolean) => set({ workSoundEnabled: enabled }),
  setSmallRestSoundEnabled: (enabled: boolean) => set({ smallRestSoundEnabled: enabled }),
  setBigRestSoundEnabled: (enabled: boolean) => set({ bigRestSoundEnabled: enabled }),
  setSoundFilePath: (path: string | null) => set({ soundFilePath: path }),
  setWorkAudioSet: (value: boolean) => set({ workAudioSet: value }),
  setSmallRestAudioSet: (value: boolean) => set({ smallRestAudioSet: value }),
  setBigRestAudioSet: (value: boolean) => set({ bigRestAudioSet: value }),
  setNotification: (message: string | null) => set({ notification: message }),
  setCurrentPage: (page: 'home' | 'settings') => set({ currentPage: page }),
}));
