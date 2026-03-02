import { useState, useEffect } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  workMinutes: number;
  restSeconds: number;
  onSave: (workMinutes: number, restSeconds: number) => void;
}

function Settings({ isOpen, onClose, workMinutes, restSeconds, onSave }: SettingsProps) {
  const [workMins, setWorkMins] = useState(0);
  const [workSecs, setWorkSecs] = useState(0);
  const [restMins, setRestMins] = useState(0);
  const [restSecs, setRestSecs] = useState(0);

  useEffect(() => {
    setWorkMins(Math.floor(workMinutes));
    setWorkSecs(Math.floor((workMinutes % 1) * 60));
    setRestMins(Math.floor(restSeconds / 60));
    setRestSecs(restSeconds % 60);
  }, [workMinutes, restSeconds, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const totalWorkSeconds = workMins * 60 + workSecs;
    const totalRestSeconds = restMins * 60 + restSecs;

    if (totalWorkSeconds > 0 && totalRestSeconds > 0) {
      // Convert to minutes for work (keep decimal for sub-minute precision)
      const workMinutesDecimal = totalWorkSeconds / 60;
      onSave(workMinutesDecimal, totalRestSeconds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-80">
        <h2 className="text-xl font-bold text-gray-800 mb-4">设置</h2>

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

        <div className="mb-6">
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

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
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
  );
}

export default Settings;
