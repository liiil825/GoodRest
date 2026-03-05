import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { copyFile, mkdir } from '@tauri-apps/plugin-fs';
import { appConfigDir, join } from '@tauri-apps/api/path';

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

export async function setRestMode(): Promise<void> {
  console.log('[tauriEvents] Calling set_rest_mode...');
  await invoke('set_rest_mode');
  console.log('[tauriEvents] set_rest_mode complete');
}

export async function setWorkMode(): Promise<void> {
  console.log('[tauriEvents] Calling set_work_mode...');
  await invoke('set_work_mode');
  console.log('[tauriEvents] set_work_mode complete');
}

/// Play a default notification sound using Web Audio API
function playDefaultSound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Nice ding sound: 880Hz (A5) sine wave with decay
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5);

    // Volume envelope: quick attack, slow decay
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  } catch (error) {
    console.error('[tauriEvents] Failed to play default sound:', error);
  }
}

/// Open file dialog to select an audio file
export async function selectAudioFile(): Promise<string | null> {
  console.log('[tauriEvents] Opening dialog...');
  const result = await open({
    multiple: false,
    filters: [{
      name: 'Audio',
      extensions: ['mp3', 'wav', 'ogg']
    }]
  });
  console.log('[tauriEvents] Dialog result:', result, typeof result);

  // Handle different return types from Tauri v2 dialog
  if (!result) {
    console.log('[tauriEvents] No file selected or dialog cancelled');
    return null;
  }

  if (Array.isArray(result)) {
    console.log('[tauriEvents] Result is array, returning first item');
    return result[0] || null;
  }

  return result as string;
}

// Global audio instance for playback control
let currentAudio: HTMLAudioElement | null = null;
let onAudioEnded: (() => void) | null = null;

/// Get audio file path from app data directory
export async function getAudioPath(): Promise<string | null> {
  try {
    const configDir = await appConfigDir();
    const audioPath = await join(configDir, 'audio', 'rest.mp3');
    return audioPath;
  } catch (error) {
    console.error('[tauriEvents] Failed to get audio path:', error);
    return null;
  }
}

/// Copy audio file to app data directory using frontend fs plugin
export async function copyAudioFile(sourcePath: string): Promise<string | null> {
  try {
    console.log('[tauriEvents] copyAudioFile called with:', sourcePath);

    // Get app config directory (e.g., ~/Library/Application Support/GoodRest on macOS)
    const configDir = await appConfigDir();
    console.log('[tauriEvents] Config dir:', configDir);

    const audioDir = await join(configDir, 'audio');
    const targetPath = await join(audioDir, 'rest.mp3');

    console.log('[tauriEvents] Target audio dir:', audioDir);
    console.log('[tauriEvents] Target path:', targetPath);

    // Always create directory (recursive) to ensure it exists
    await mkdir(audioDir, { recursive: true });
    console.log('[tauriEvents] Directory created/exists');

    // Copy the file
    await copyFile(sourcePath, targetPath);
    console.log('[tauriEvents] File copied successfully');

    return targetPath;
  } catch (error) {
    console.error('[tauriEvents] Failed to copy audio file:', error);
    return null;
  }
}

/// Check if custom audio file exists using backend command
export async function checkCustomAudioExists(): Promise<boolean> {
  try {
    return await invoke<boolean>('check_custom_audio_exists');
  } catch {
    return false;
  }
}

/// Get audio file as base64 data URL from backend
export async function getAudioBase64(): Promise<string | null> {
  try {
    return await invoke<string>('get_audio_base64');
  } catch (error) {
    console.error('[tauriEvents] Failed to get audio base64:', error);
    return null;
  }
}

/// Play sound with fixed path (supports .mp3, .wav, .ogg)
export async function playSound(customAudio: boolean): Promise<void> {
  // If custom audio is not set, play default sound
  if (!customAudio) {
    playDefaultSound();
    return;
  }

  try {
    // Get audio as base64 data URL from backend
    const audioDataUrl = await getAudioBase64();
    if (!audioDataUrl) {
      console.log('[tauriEvents] No custom audio set, playing default sound');
      playDefaultSound();
      return;
    }

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    console.log('[tauriEvents] Playing custom audio from base64 data');

    const audio = new Audio(audioDataUrl);
    currentAudio = audio;

    audio.onended = () => {
      currentAudio = null;
      if (onAudioEnded) {
        onAudioEnded();
        onAudioEnded = null;
      }
    };

    audio.onerror = () => {
      console.error('[tauriEvents] Failed to load audio file, playing default sound');
      currentAudio = null;
      playDefaultSound();
    };

    await audio.play();
  } catch (error) {
    console.error('[tauriEvents] Failed to play sound:', error);
    playDefaultSound();
  }
}

/// Play sound with callback when audio ends
export async function playSoundWithCallback(customAudio: boolean, onEnd: () => void): Promise<void> {
  onAudioEnded = onEnd;

  if (!customAudio) {
    playDefaultSound();
    onEnd();
    return;
  }

  try {
    // Get audio as base64 data URL from backend
    const audioDataUrl = await getAudioBase64();
    if (!audioDataUrl) {
      playDefaultSound();
      onEnd();
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    console.log('[tauriEvents] Playing custom audio from base64 data');

    const audio = new Audio(audioDataUrl);
    currentAudio = audio;

    audio.onended = () => {
      currentAudio = null;
      if (onAudioEnded) {
        onAudioEnded();
        onAudioEnded = null;
      }
    };

    audio.onerror = () => {
      currentAudio = null;
      playDefaultSound();
      if (onAudioEnded) {
        onAudioEnded();
        onAudioEnded = null;
      }
    };

    await audio.play();
  } catch (error) {
    console.error('[tauriEvents] Failed to play sound:', error);
    playDefaultSound();
    onEnd();
  }
}

/// Pause current audio
export function pauseSound(): void {
  if (currentAudio) {
    currentAudio.pause();
  }
}

/// Resume current audio
export async function resumeSound(): Promise<void> {
  if (currentAudio) {
    await currentAudio.play();
  }
}

/// Check if audio is currently playing
export function isPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

/// Stop current audio
export function stopSound(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
