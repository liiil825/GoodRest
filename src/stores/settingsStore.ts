import { create } from 'zustand';
import { DEFAULT_INTERVAL_MINUTES } from '../lib/constants';

interface SettingsState {
  intervalMinutes: number;
  isPaused: boolean;
  nextReminderSeconds: number | null;
  workMode: 'working' | 'resting';
  soundEnabled: boolean;
  soundFilePath: string | null;
  customAudioSet: boolean;
  notification: string | null;
  currentPage: 'home' | 'settings';
  setInterval: (minutes: number) => void;
  setIsPaused: (paused: boolean) => void;
  setNextReminderSeconds: (seconds: number | null) => void;
  setWorkMode: (mode: 'working' | 'resting') => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundFilePath: (path: string | null) => void;
  setCustomAudioSet: (value: boolean) => void;
  setNotification: (message: string | null) => void;
  setCurrentPage: (page: 'home' | 'settings') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  intervalMinutes: DEFAULT_INTERVAL_MINUTES,
  isPaused: false,
  nextReminderSeconds: null,
  workMode: 'working',
  soundEnabled: true,
  soundFilePath: null,
  customAudioSet: false,
  notification: null,
  currentPage: 'home',
  setInterval: (minutes: number) => set({ intervalMinutes: minutes }),
  setIsPaused: (paused: boolean) => set({ isPaused: paused }),
  setNextReminderSeconds: (seconds: number | null) => set({ nextReminderSeconds: seconds }),
  setWorkMode: (mode: 'working' | 'resting') => set({ workMode: mode }),
  setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
  setSoundFilePath: (path: string | null) => set({ soundFilePath: path }),
  setCustomAudioSet: (value: boolean) => set({ customAudioSet: value }),
  setNotification: (message: string | null) => set({ notification: message }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
