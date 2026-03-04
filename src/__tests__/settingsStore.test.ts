import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../stores/settingsStore';
import { DEFAULT_INTERVAL_MINUTES } from '../lib/constants';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      intervalMinutes: DEFAULT_INTERVAL_MINUTES,
      isPaused: false,
      nextReminderSeconds: null,
      workMode: 'working',
      soundEnabled: true,
      soundFilePath: null,
      notification: null,
    });
  });

  it('initial state has correct default values', () => {
    const state = useSettingsStore.getState();
    expect(state.intervalMinutes).toBe(DEFAULT_INTERVAL_MINUTES);
    expect(state.isPaused).toBe(false);
    expect(state.workMode).toBe('working');
    expect(state.soundEnabled).toBe(true);
  });

  it('setInterval updates intervalMinutes', () => {
    const { setInterval } = useSettingsStore.getState();
    setInterval(30);
    expect(useSettingsStore.getState().intervalMinutes).toBe(30);
  });

  it('setIsPaused updates isPaused state', () => {
    const { setIsPaused } = useSettingsStore.getState();
    setIsPaused(true);
    expect(useSettingsStore.getState().isPaused).toBe(true);
    setIsPaused(false);
    expect(useSettingsStore.getState().isPaused).toBe(false);
  });

  it('setWorkMode updates workMode state', () => {
    const { setWorkMode } = useSettingsStore.getState();
    setWorkMode('resting');
    expect(useSettingsStore.getState().workMode).toBe('resting');
    setWorkMode('working');
    expect(useSettingsStore.getState().workMode).toBe('working');
  });

  it('setNextReminderSeconds updates countdown', () => {
    const { setNextReminderSeconds } = useSettingsStore.getState();
    setNextReminderSeconds(300);
    expect(useSettingsStore.getState().nextReminderSeconds).toBe(300);
  });

  it('setSoundFilePath updates sound file path', () => {
    const { setSoundFilePath } = useSettingsStore.getState();
    setSoundFilePath('/path/to/sound.mp3');
    expect(useSettingsStore.getState().soundFilePath).toBe('/path/to/sound.mp3');
  });
});
