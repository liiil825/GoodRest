import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { selectAudioFile, copyAudioFile, playSound, pauseSound, resumeSound, isPlaying, stopSound } from '../lib/tauriEvents';

interface SettingsProps {
  workMinutes: number;
  restSeconds: number;
  onSave: (workMinutes: number, restSeconds: number) => void;
}

function Settings({ workMinutes, restSeconds, onSave }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'time' | 'audio'>('time');
  const [workMins, setWorkMins] = useState(0);
  const [workSecs, setWorkSecs] = useState(0);
  const [restMins, setRestMins] = useState(0);
  const [restSecs, setRestSecs] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const { notification, setNotification, soundEnabled, setSoundEnabled, customAudioSet, setCustomAudioSet, setCurrentPage } = useSettingsStore();

  useEffect(() => {
    setWorkMins(Math.floor(workMinutes));
    setWorkSecs(Math.floor((workMinutes % 1) * 60));
    setRestMins(Math.floor(restSeconds / 60));
    setRestSecs(restSeconds % 60);
  }, [workMinutes, restSeconds]);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  const handleSelectSound = async () => {
    console.log('[Settings] Opening audio file dialog...');
    try {
      const file = await selectAudioFile();
      console.log('[Settings] Selected file:', file);
      if (file) {
        console.log('[Settings] Copying audio file...');
        const destPath = await copyAudioFile(file);
        console.log('[Settings] Copied to:', destPath);
        if (destPath) {
          setCustomAudioSet(true);
          setNotification('音频文件已设置');
        } else {
          setNotification('音频文件复制失败');
        }
      } else {
        console.log('[Settings] No file selected');
        // User cancelled - no notification needed
      }
    } catch (error) {
      console.error('[Settings] Error selecting audio:', error);
      setNotification('选择音频失败');
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying()) {
      pauseSound();
      setIsAudioPlaying(false);
    } else {
      if (isAudioPlaying) {
        // Resume
        await resumeSound();
      } else {
        // Start playing
        await playSound(customAudioSet);
        setIsAudioPlaying(true);
        // Auto-reset button after audio ends (approximate)
        setTimeout(() => setIsAudioPlaying(false), 2000);
      }
    }
  };

  const handleSave = () => {
    const totalWorkSeconds = workMins * 60 + workSecs;
    const totalRestSeconds = restMins * 60 + restSecs;

    if (totalWorkSeconds > 0 && totalRestSeconds > 0) {
      // Convert to minutes for work (keep decimal for sub-minute precision)
      const workMinutesDecimal = totalWorkSeconds / 60;
      onSave(workMinutesDecimal, totalRestSeconds);
      setNotification('设置已保存');
      // Navigate back to home after saving
      setTimeout(() => setCurrentPage('home'), 500);
    }
  };

  const handleCancel = () => {
    setNotification('已取消');
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setCurrentPage('home')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 返回
          </button>
          <h2 className="text-xl font-bold text-gray-800 ml-4">设置</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Tab buttons */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('time')}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                activeTab === 'time'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              时间
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                activeTab === 'audio'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              音频
            </button>
          </div>

          {/* Notification */}
          {notification && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-lg text-center text-sm">
              {notification}
            </div>
          )}

          {/* Time Tab */}
          {activeTab === 'time' && (
            <div className="min-h-[200px]">
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">工作时间</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={workMins}
                      onChange={(e) => setWorkMins(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="分钟"
                    />
                    <span className="text-xs text-gray-500">分钟</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={workSecs}
                      onChange={(e) => setWorkSecs(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="秒"
                    />
                    <span className="text-xs text-gray-500">秒</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">休息时间</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={restMins}
                      onChange={(e) => setRestMins(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="分钟"
                    />
                    <span className="text-xs text-gray-500">分钟</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={restSecs}
                      onChange={(e) => setRestSecs(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="秒"
                    />
                    <span className="text-xs text-gray-500">秒</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audio Tab */}
          {activeTab === 'audio' && (
            <div className="min-h-[200px]">
              {/* Enable sound toggle */}
              <div className="mb-4">
                <label className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>启用音效</span>
                  <div
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
                      soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </label>
              </div>

              {/* Current audio display */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">当前音频</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {customAudioSet ? '自定义音频' : '默认音效'}
                </div>
              </div>

              {/* Play/Pause and Select buttons */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handlePlayPause}
                  disabled={!soundEnabled}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    soundEnabled
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isAudioPlaying ? '⏸ 暂停' : '▶ 播放'}
                </button>
                <button
                  onClick={handleSelectSound}
                  disabled={!soundEnabled}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    soundEnabled
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  选择文件
                </button>
              </div>

              {/* Hint text */}
              <p className="text-xs text-gray-400">
                选择音频文件后，会自动复制到应用数据目录
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
