import { create } from 'zustand';
import { DEFAULT_INTERVAL_MINUTES } from '../lib/constants';

interface SettingsState {
  intervalMinutes: number;
  isPaused: boolean;
  nextReminderSeconds: number | null;
  workMode: 'working' | 'resting';
  soundEnabled: boolean;
  soundFilePath: string | null;
  notification: string | null;
  setInterval: (minutes: number) => void;
  setIsPaused: (paused: boolean) => void;
  setNextReminderSeconds: (seconds: number | null) => void;
  setWorkMode: (mode: 'working' | 'resting') => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundFilePath: (path: string | null) => void;
  setNotification: (message: string | null) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  intervalMinutes: DEFAULT_INTERVAL_MINUTES,
  isPaused: false,
  nextReminderSeconds: null,
  workMode: 'working',
  soundEnabled: true,
  soundFilePath: null,
  notification: null,
  setInterval: (minutes: number) => set({ intervalMinutes: minutes }),
  setIsPaused: (paused: boolean) => set({ isPaused: paused }),
  setNextReminderSeconds: (seconds: number | null) => set({ nextReminderSeconds: seconds }),
  setWorkMode: (mode: 'working' | 'resting') => set({ workMode: mode }),
  setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
  setSoundFilePath: (path: string | null) => set({ soundFilePath: path }),
  setNotification: (message: string | null) => set({ notification: message }),
}));
