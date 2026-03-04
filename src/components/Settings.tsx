import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { selectAudioFile } from '../lib/tauriEvents';

interface SettingsProps {
  workMinutes: number;
  restSeconds: number;
  onSave: (workMinutes: number, restSeconds: number, soundFilePath: string | null) => void;
}

function Settings({ workMinutes, restSeconds, onSave }: SettingsProps) {
  const [workMins, setWorkMins] = useState(0);
  const [workSecs, setWorkSecs] = useState(0);
  const [restMins, setRestMins] = useState(0);
  const [restSecs, setRestSecs] = useState(0);
  const [soundFile, setSoundFile] = useState<string | null>(null);

  const { notification, setNotification, soundEnabled, setSoundEnabled, setCurrentPage } = useSettingsStore();

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

  const handleSelectSound = async () => {
    const file = await selectAudioFile();
    if (file) {
      setSoundFile(file);
    }
  };

  const handleSave = () => {
    const totalWorkSeconds = workMins * 60 + workSecs;
    const totalRestSeconds = restMins * 60 + restSecs;

    if (totalWorkSeconds > 0 && totalRestSeconds > 0) {
      // Convert to minutes for work (keep decimal for sub-minute precision)
      const workMinutesDecimal = totalWorkSeconds / 60;
      onSave(workMinutesDecimal, totalRestSeconds, soundFile);
      setNotification('设置已保存');
    }
  };

  const handleCancel = () => {
    setNotification('已取消');
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
          {/* Notification */}
          {notification && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-lg text-center text-sm">
              {notification}
            </div>
          )}

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

        {/* Sound settings */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            休息结束时播放声音
          </label>
          {soundEnabled && (
            <div className="flex gap-2">
              <button
                onClick={handleSelectSound}
                className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors truncate"
              >
                {soundFile ? soundFile.split(/[\\/]/).pop() : '选择音频文件'}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
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
