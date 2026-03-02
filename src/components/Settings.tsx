import { useState, useEffect } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  workMinutes: number;
  restSeconds: number;
  onSave: (workMinutes: number, restSeconds: number) => void;
}

function Settings({ isOpen, onClose, workMinutes, restSeconds, onSave }: SettingsProps) {
  const [workTime, setWorkTime] = useState(workMinutes);
  const [restTime, setRestTime] = useState(restSeconds);

  useEffect(() => {
    setWorkTime(workMinutes);
    setRestTime(restSeconds);
  }, [workMinutes, restSeconds, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (workTime > 0 && restTime > 0) {
      onSave(workTime, restTime);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-80">
        <h2 className="text-xl font-bold text-gray-800 mb-4">设置</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">工作时间（分钟）</label>
          <input
            type="number"
            min="1"
            max="120"
            value={workTime}
            onChange={(e) => setWorkTime(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-1">休息时间（秒）</label>
          <input
            type="number"
            min="5"
            max="300"
            value={restTime}
            onChange={(e) => setRestTime(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
