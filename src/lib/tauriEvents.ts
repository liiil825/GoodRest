import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface TauriEvents {
  'show-reminder': () => void;
  'reminder-skipped': () => void;
  'reminder-snoozed': (minutes: number) => void;
  'timer-paused': () => void;
  'timer-resumed': () => void;
}

export async function listenToEvent<K extends keyof TauriEvents>(
  event: K,
  handler: TauriEvents[K]
): Promise<() => void> {
  return listen(event as string, (e) => {
    if (event === 'reminder-snoozed') {
      (handler as (minutes: number) => void)(e.payload as number);
    } else {
      (handler as () => void)();
    }
  });
}

export async function setInterval(minutes: number): Promise<void> {
  await invoke('set_interval', { minutes });
}

export async function getInterval(): Promise<number> {
  return await invoke('get_interval');
}

export async function skipReminder(): Promise<void> {
  await invoke('skip_reminder');
}

export async function snoozeReminder(minutes: number): Promise<void> {
  await invoke('snooze_reminder', { minutes });
}

export async function isTimerPaused(): Promise<boolean> {
  return await invoke('is_timer_paused');
}

export async function getNextReminderSeconds(): Promise<number | null> {
  return await invoke('get_next_reminder_seconds');
}
