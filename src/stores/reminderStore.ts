import { create } from 'zustand';

interface ReminderState {
  isShowing: boolean;
  currentMessage: string;
  showReminder: (message: string) => void;
  hideReminder: () => void;
}

export const useReminderStore = create<ReminderState>((set) => ({
  isShowing: false,
  currentMessage: '',
  showReminder: (message: string) => set({ isShowing: true, currentMessage: message }),
  hideReminder: () => set({ isShowing: false, currentMessage: '' }),
}));
