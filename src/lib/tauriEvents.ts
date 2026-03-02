import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface TauriEvents {
  'show-reminder': () => void;
  'reminder-skipped': () => void;
  'reminder-snoozed': (minutes: number) => void;
  'timer-paused': () => void;
  'timer-resumed': () => void;
  'work-ended': () => void;
  'rest-ended': () => void;
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

export async function setWorkInterval(minutes: number): Promise<void> {
  await invoke('set_interval', { minutes });
}

export async function getInterval(): Promise<number> {
  return await invoke('get_interval');
}

export async function setRestDuration(seconds: number): Promise<void> {
  await invoke('set_rest_duration', { seconds });
}

export async function getRestDuration(): Promise<number> {
  return await invoke('get_rest_duration');
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

export async function getWorkMode(): Promise<'working' | 'resting'> {
  const mode = await invoke<string>('get_work_mode');
  return mode as 'working' | 'resting';
}
