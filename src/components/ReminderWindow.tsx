import { useState } from 'react';

interface ReminderWindowProps {
  message: string;
  onSkip: () => void;
  onSnooze: (minutes: number) => void;
  snoozeOptions: number[];
}

function ReminderWindow({ message, onSkip, onSnooze, snoozeOptions }: ReminderWindowProps) {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-5xl font-bold text-white mb-8 animate-pulse">
          {message}
        </h2>

        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
            className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white text-xl font-semibold rounded-full backdrop-blur-sm transition-all duration-200"
          >
            稍后提醒
          </button>

          <button
            onClick={onSkip}
            className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white text-xl font-semibold rounded-full backdrop-blur-sm transition-all duration-200"
          >
            跳过
          </button>
        </div>

        {showSnoozeOptions && (
          <div className="mt-6 flex gap-2 justify-center flex-wrap">
            {snoozeOptions.map((minutes) => (
              <button
                key={minutes}
                onClick={() => onSnooze(minutes)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all duration-200"
              >
                {minutes}分钟后
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReminderWindow;
