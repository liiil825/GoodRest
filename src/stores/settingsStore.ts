import { create } from 'zustand';
import { DEFAULT_INTERVAL_MINUTES } from '../lib/constants';

interface SettingsState {
  intervalMinutes: number;
  isPaused: boolean;
  setInterval: (minutes: number) => void;
  setIsPaused: (paused: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  intervalMinutes: DEFAULT_INTERVAL_MINUTES,
  isPaused: false,
  setInterval: (minutes: number) => set({ intervalMinutes: minutes }),
  setIsPaused: (paused: boolean) => set({ isPaused: paused }),
}));
