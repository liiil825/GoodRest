import { useState, useEffect } from 'react';

interface ReminderWindowProps {
  message: string;
  onSkip: () => void;
  onSnooze: (minutes: number) => void;
  snoozeOptions: number[];
  countdown: number | null;
  totalRestSeconds: number;
}

function ReminderWindow({ message, onSkip, onSnooze, snoozeOptions, countdown, totalRestSeconds }: ReminderWindowProps) {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [displayCountdown, setDisplayCountdown] = useState<number | null>(null);

  // Calculate progress percentage
  const progress = totalRestSeconds > 0 && countdown !== null
    ? ((totalRestSeconds - countdown) / totalRestSeconds) * 100
    : 0;

  useEffect(() => {
    setDisplayCountdown(countdown);
  }, [countdown]);

  useEffect(() => {
    if (displayCountdown === null || displayCountdown <= 0) return;
    const timer = setInterval(() => {
      setDisplayCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(timer);
  }, [displayCountdown]);

  function formatCountdown(seconds: number | null): string {
    if (seconds === null) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}秒`;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col">
      {/* Progress bar at top */}
      <div className="w-full h-2 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-5xl font-bold text-white mb-4 animate-pulse">{message}</h2>

        <p className="text-3xl font-semibold text-white/90">
          休息倒计时: {formatCountdown(displayCountdown)}
        </p>
      </div>

      {/* Buttons at bottom */}
      <div className="p-8 flex flex-col items-center gap-4">
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
          <div className="flex gap-2 justify-center flex-wrap">
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
