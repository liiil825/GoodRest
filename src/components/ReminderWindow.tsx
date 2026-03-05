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
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900 via-emerald-950 to-green-950 flex flex-col z-[100] animate-in fade-in duration-700">
      {/* Immersive ambient blur effect in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-teal-400/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>

      {/* Progress bar at top - ultra thin and glowing */}
      <div className="w-full h-1 bg-white/5 relative z-10">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <h2 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-100 mb-8 tracking-tight drop-shadow-lg"
          style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
          {message}
        </h2>

        <div className="flex flex-col items-center relative">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/60 font-semibold mb-2">休息倒计时</p>
          <p className="text-6xl font-black text-white/90 tabular-nums tracking-tighter drop-shadow-md">
            {formatCountdown(displayCountdown)}
          </p>
        </div>
      </div>

      {/* Buttons at bottom */}
      <div className="p-10 pb-16 flex flex-col items-center gap-6 relative z-10 w-full max-w-2xl mx-auto">
        <div className="flex gap-6 justify-center flex-wrap w-full">
          <button
            onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
            className="flex-1 min-w-[140px] px-8 py-5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/90 text-lg font-semibold rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 active:scale-95 group"
          >
            <span className="group-hover:text-white transition-colors">稍后提醒</span>
          </button>

          <button
            onClick={onSkip}
            className="flex-1 min-w-[140px] px-8 py-5 bg-white/10 hover:bg-emerald-500/20 border border-white/20 hover:border-emerald-400/50 text-white text-lg font-semibold rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <span>提前结束</span>
          </button>
        </div>

        {/* Snooze Options Drawer */}
        <div className={`w-full transition-all duration-500 overflow-hidden ${showSnoozeOptions ? 'max-h-40 opacity-100 pt-2' : 'max-h-0 opacity-0'}`}>
          <div className="flex gap-3 justify-center flex-wrap">
            {snoozeOptions.map((minutes) => (
              <button
                key={minutes}
                onClick={() => onSnooze(minutes)}
                className="px-6 py-3 bg-white/[0.05] hover:bg-white/[0.15] border border-white/[0.05] hover:border-white/20 text-white/80 hover:text-white rounded-xl backdrop-blur-md transition-all duration-300 active:scale-95 flex-1 min-w-[100px] text-sm font-medium"
              >
                {minutes} 分钟
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReminderWindow;
