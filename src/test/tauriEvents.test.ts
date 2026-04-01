import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock functions
const mockInvoke = vi.fn();
const mockOpen = vi.fn();
const mockCopyFile = vi.fn();
const mockMkdir = vi.fn();
const mockAppConfigDir = vi.fn();
const mockJoin = vi.fn();

// Mock the modules before importing
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/api/path', () => ({
  appConfigDir: mockAppConfigDir,
  join: mockJoin,
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: mockOpen,
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  copyFile: mockCopyFile,
  mkdir: mockMkdir,
}));

// Import after mocks
import {
  selectAudioFile,
  copyAudioFileByType,
  playSoundByType,
  stopAudioByRust,
  checkAudioExists,
  getAudioBase64ByType,
  setWorkInterval,
  getInterval,
  setRestDuration,
  getWorkMode,
  skipReminder,
  snoozeReminder,
} from '../lib/tauriEvents';

describe('tauriEvents - Audio Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppConfigDir.mockResolvedValue('/mock/config/dir');
    mockJoin.mockImplementation(async (...paths: string[]) => paths.join('/'));
  });

  describe('selectAudioFile', () => {
    it('should return null when dialog is cancelled', async () => {
      mockOpen.mockResolvedValue(null);

      const result = await selectAudioFile();

      expect(result).toBeNull();
      expect(mockOpen).toHaveBeenCalledWith({
        multiple: false,
        filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg'] }],
      });
    });

    it('should return file path when file is selected', async () => {
      mockOpen.mockResolvedValue('/path/to/audio.mp3');

      const result = await selectAudioFile();

      expect(result).toBe('/path/to/audio.mp3');
    });

    it('should return first item when array is returned', async () => {
      mockOpen.mockResolvedValue(['/path/to/audio1.mp3', '/path/to/audio2.mp3']);

      const result = await selectAudioFile();

      expect(result).toBe('/path/to/audio1.mp3');
    });
  });

  describe('copyAudioFileByType', () => {
    it('should copy file to correct path for work audio', async () => {
      await copyAudioFileByType('/source/work.mp3', 'work');

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockCopyFile).toHaveBeenCalledWith(
        '/source/work.mp3',
        expect.stringContaining('work.mp3')
      );
    });

    it('should copy file to correct path for small_rest audio', async () => {
      await copyAudioFileByType('/source/small.mp3', 'small_rest');

      expect(mockCopyFile).toHaveBeenCalledWith(
        '/source/small.mp3',
        expect.stringContaining('small_rest.mp3')
      );
    });

    it('should copy file to correct path for big_rest audio', async () => {
      await copyAudioFileByType('/source/big.mp3', 'big_rest');

      expect(mockCopyFile).toHaveBeenCalledWith(
        '/source/big.mp3',
        expect.stringContaining('big_rest.mp3')
      );
    });
  });

  describe('playSoundByType', () => {
    it('should call invoke with play_audio_by_type command for work', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await playSoundByType('work', true);

      expect(mockInvoke).toHaveBeenCalledWith('play_audio_by_type', { audioType: 'work' });
    });

    it('should call invoke with play_audio_by_type command for small_rest', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await playSoundByType('small_rest', true);

      expect(mockInvoke).toHaveBeenCalledWith('play_audio_by_type', { audioType: 'small_rest' });
    });

    it('should call invoke with play_audio_by_type command for big_rest', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await playSoundByType('big_rest', true);

      expect(mockInvoke).toHaveBeenCalledWith('play_audio_by_type', { audioType: 'big_rest' });
    });
  });

  describe('stopAudioByRust', () => {
    it('should call invoke with stop_audio command', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await stopAudioByRust();

      expect(mockInvoke).toHaveBeenCalledWith('stop_audio');
    });

    it('should handle errors gracefully without throwing', async () => {
      mockInvoke.mockRejectedValue(new Error('Audio stopped'));

      // Should not throw
      await expect(stopAudioByRust()).resolves.toBeUndefined();
    });
  });

  describe('checkAudioExists', () => {
    it('should call invoke with check_audio_exists command and return true', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await checkAudioExists('work');

      expect(mockInvoke).toHaveBeenCalledWith('check_audio_exists', { audioType: 'work' });
      expect(result).toBe(true);
    });

    it('should return false when invoke throws', async () => {
      mockInvoke.mockRejectedValue(new Error('Not found'));

      const result = await checkAudioExists('work');

      expect(result).toBe(false);
    });
  });

  describe('getAudioBase64ByType', () => {
    it('should return base64 string when successful', async () => {
      mockInvoke.mockResolvedValue('data:audio/mpeg;base64,abc123');

      const result = await getAudioBase64ByType('work');

      expect(mockInvoke).toHaveBeenCalledWith('get_audio_base64_by_type', { audioType: 'work' });
      expect(result).toBe('data:audio/mpeg;base64,abc123');
    });

    it('should return null when invoke throws', async () => {
      mockInvoke.mockRejectedValue(new Error('File not found'));

      const result = await getAudioBase64ByType('work');

      expect(result).toBeNull();
    });
  });
});

describe('tauriEvents - Timer Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setWorkInterval', () => {
    it('should call invoke with set_interval command', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await setWorkInterval(25);

      expect(mockInvoke).toHaveBeenCalledWith('set_interval', { minutes: 25 });
    });

    it('should call invoke with decimal minutes', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await setWorkInterval(20.5);

      expect(mockInvoke).toHaveBeenCalledWith('set_interval', { minutes: 20.5 });
    });
  });

  describe('getInterval', () => {
    it('should return the interval value from invoke', async () => {
      mockInvoke.mockResolvedValue(20);

      const result = await getInterval();

      expect(mockInvoke).toHaveBeenCalledWith('get_interval');
      expect(result).toBe(20);
    });
  });

  describe('setRestDuration', () => {
    it('should call invoke with set_rest_duration command', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await setRestDuration(300);

      expect(mockInvoke).toHaveBeenCalledWith('set_rest_duration', { seconds: 300 });
    });
  });

  describe('getWorkMode', () => {
    it('should return working mode', async () => {
      mockInvoke.mockResolvedValue('working');

      const result = await getWorkMode();

      expect(result).toBe('working');
    });

    it('should return resting mode', async () => {
      mockInvoke.mockResolvedValue('resting');

      const result = await getWorkMode();

      expect(result).toBe('resting');
    });

    it('should return big_resting mode', async () => {
      mockInvoke.mockResolvedValue('big_resting');

      const result = await getWorkMode();

      expect(result).toBe('big_resting');
    });
  });

  describe('skipReminder', () => {
    it('should call invoke with skip_reminder command', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await skipReminder();

      expect(mockInvoke).toHaveBeenCalledWith('skip_reminder');
    });
  });

  describe('snoozeReminder', () => {
    it('should call invoke with snooze_reminder command and minutes', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await snoozeReminder(5);

      expect(mockInvoke).toHaveBeenCalledWith('snooze_reminder', { minutes: 5 });
    });

    it('should handle different minute values', async () => {
      mockInvoke.mockResolvedValue(undefined);

      await snoozeReminder(10);

      expect(mockInvoke).toHaveBeenCalledWith('snooze_reminder', { minutes: 10 });
    });
  });
});
