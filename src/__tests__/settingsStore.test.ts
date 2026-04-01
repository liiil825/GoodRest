import { describe, it, expect } from 'vitest';
import { useSettingsStore } from '../stores/settingsStore';

describe('settingsStore', () => {
  it('initial state has correct default values', () => {
    const state = useSettingsStore.getState();
    expect(state.intervalMinutes).toBe(20);
    expect(state.restSeconds).toBe(20);
    expect(state.bigTomatoRestSeconds).toBe(900);
    expect(state.isPaused).toBe(false);
    expect(state.workMode).toBe('working');
    expect(state.workSoundEnabled).toBe(true);
    expect(state.smallRestSoundEnabled).toBe(true);
    expect(state.bigRestSoundEnabled).toBe(true);
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
    setWorkMode('big_resting');
    expect(useSettingsStore.getState().workMode).toBe('big_resting');
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

  it('setBigTomatoRestSeconds updates big rest duration', () => {
    const { setBigTomatoRestSeconds } = useSettingsStore.getState();
    setBigTomatoRestSeconds(1200); // 20 minutes
    expect(useSettingsStore.getState().bigTomatoRestSeconds).toBe(1200);
  });

  it('tomato counts can be updated', () => {
    const { setSmallTomatoCount, setBigTomatoCount } = useSettingsStore.getState();
    setSmallTomatoCount(2);
    setBigTomatoCount(1);
    expect(useSettingsStore.getState().smallTomatoCount).toBe(2);
    expect(useSettingsStore.getState().bigTomatoCount).toBe(1);
  });
});
