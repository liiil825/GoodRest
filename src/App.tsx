import { useEffect, useState } from 'react';
import { useReminderStore } from './stores/reminderStore';
import { useSettingsStore } from './stores/settingsStore';
import { listenToEvent, skipReminder, snoozeReminder, getNextReminderSeconds, getWorkMode, setWorkInterval, setRestDuration, getInterval, getRestDuration } from './lib/tauriEvents';
import { DEFAULT_REMINDER_MESSAGES, SNOOZE_OPTIONS, DEFAULT_INTERVAL_MINUTES, DEFAULT_REST_SECONDS } from './lib/constants';
import ReminderWindow from './components/ReminderWindow';
import Settings from './components/Settings';

function formatRemainingTime(seconds: number | null): string {
  if (seconds === null) {
    return '计算中...';
  }
  if (seconds <= 0) {
    return '即将提醒';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  }
  return `${seconds}秒`;
}

function App() {
  const { isShowing, showReminder, hideReminder } = useReminderStore();
  const { isPaused, setIsPaused, nextReminderSeconds, setNextReminderSeconds, workMode, setWorkMode } = useSettingsStore();

  const [showSettings, setShowSettings] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(DEFAULT_INTERVAL_MINUTES);
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST_SECONDS);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      const interval = await getInterval();
      const rest = await getRestDuration();
      setWorkMinutes(interval);
      setRestSeconds(rest);
    };
    fetchSettings();
  }, []);

  // Fetch remaining time and work mode periodically
  useEffect(() => {
    const fetchData = async () => {
      const seconds = await getNextReminderSeconds();
      const mode = await getWorkMode();
      setNextReminderSeconds(seconds);
      setWorkMode(mode);
    };

    // Initial fetch
    fetchData();

    // Update every second
    const timer = setInterval(fetchData, 1000);
    return () => clearInterval(timer);
  }, [setNextReminderSeconds, setWorkMode]);

  useEffect(() => {
    // Listen for reminder events from Rust backend
    const unlistenShow = listenToEvent('show-reminder', () => {
      const randomMessage =
        DEFAULT_REMINDER_MESSAGES[Math.floor(Math.random() * DEFAULT_REMINDER_MESSAGES.length)];
      showReminder(randomMessage);
    });

    const unlistenSkipped = listenToEvent('reminder-skipped', () => {
      hideReminder();
      setWorkMode('working');
    });

    const unlistenSnoozed = listenToEvent('reminder-snoozed', () => {
      hideReminder();
      setWorkMode('working');
    });

    const unlistenWorkEnded = listenToEvent('work-ended', () => {
      setWorkMode('resting');
    });

    const unlistenRestEnded = listenToEvent('rest-ended', () => {
      setWorkMode('working');
      hideReminder();
    });

    const unlistenPaused = listenToEvent('timer-paused', () => {
      setIsPaused(true);
    });

    const unlistenResumed = listenToEvent('timer-resumed', () => {
      setIsPaused(false);
    });

    return () => {
      unlistenShow.then((fn: () => void) => fn());
      unlistenSkipped.then((fn: () => void) => fn());
      unlistenSnoozed.then((fn: () => void) => fn());
      unlistenWorkEnded.then((fn: () => void) => fn());
      unlistenRestEnded.then((fn: () => void) => fn());
      unlistenPaused.then((fn: () => void) => fn());
      unlistenResumed.then((fn: () => void) => fn());
    };
  }, [showReminder, hideReminder, setIsPaused, setWorkMode]);

  const handleSkip = async () => {
    await skipReminder();
    hideReminder();
  };

  const handleSnooze = async (minutes: number) => {
    await snoozeReminder(minutes);
    hideReminder();
  };

  const handleSaveSettings = async (workMins: number, restSecs: number) => {
    await setWorkInterval(workMins);
    await setRestDuration(restSecs);
    setWorkMinutes(workMins);
    setRestSeconds(restSecs);
  };

  // Show rest screen when in rest mode
  const isResting = workMode === 'resting';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        workMinutes={workMinutes}
        restSeconds={restSeconds}
        onSave={handleSaveSettings}
      />
      {isResting || isShowing ? (
        <ReminderWindow
          message={useReminderStore.getState().currentMessage || '休息一下'}
          onSkip={handleSkip}
          onSnooze={handleSnooze}
          snoozeOptions={SNOOZE_OPTIONS}
        />
      ) : (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">GoodRest</h1>
          <p className="text-gray-600 mb-8">让定时休息成为习惯</p>

          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <div className="mb-4">
              <p className="text-sm text-gray-500">状态</p>
              <p
                className={`text-lg font-medium ${isPaused ? 'text-yellow-600' : 'text-green-600'}`}
              >
                {isPaused ? '已暂停' : '工作中'}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">下次休息</p>
              <p className="text-lg font-medium text-gray-800">
                {isPaused ? '已暂停' : formatRemainingTime(nextReminderSeconds)}
              </p>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="mt-2 px-4 py-2 text-sm text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              设置
            </button>

            <div className="text-xs text-gray-400 mt-4">点击系统托盘图标可显示此窗口</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
