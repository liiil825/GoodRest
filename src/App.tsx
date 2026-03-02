import { useEffect } from 'react';
import { useReminderStore } from './stores/reminderStore';
import { useSettingsStore } from './stores/settingsStore';
import { listenToEvent, skipReminder, snoozeReminder, getNextReminderSeconds } from './lib/tauriEvents';
import { DEFAULT_REMINDER_MESSAGES, SNOOZE_OPTIONS } from './lib/constants';
import ReminderWindow from './components/ReminderWindow';

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
  const { isPaused, setIsPaused, nextReminderSeconds, setNextReminderSeconds } = useSettingsStore();

  // Fetch remaining time periodically
  useEffect(() => {
    const fetchRemainingTime = async () => {
      const seconds = await getNextReminderSeconds();
      setNextReminderSeconds(seconds);
    };

    // Initial fetch
    fetchRemainingTime();

    // Update every second
    const interval = setInterval(fetchRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [setNextReminderSeconds]);

  useEffect(() => {
    // Listen for reminder events from Rust backend
    const unlistenShow = listenToEvent('show-reminder', () => {
      const randomMessage =
        DEFAULT_REMINDER_MESSAGES[Math.floor(Math.random() * DEFAULT_REMINDER_MESSAGES.length)];
      showReminder(randomMessage);
    });

    const unlistenSkipped = listenToEvent('reminder-skipped', () => {
      hideReminder();
    });

    const unlistenSnoozed = listenToEvent('reminder-snoozed', () => {
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
      unlistenPaused.then((fn: () => void) => fn());
      unlistenResumed.then((fn: () => void) => fn());
    };
  }, [showReminder, hideReminder, setIsPaused]);

  const handleSkip = async () => {
    await skipReminder();
    hideReminder();
  };

  const handleSnooze = async (minutes: number) => {
    await snoozeReminder(minutes);
    hideReminder();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {isShowing ? (
        <ReminderWindow
          message={useReminderStore.getState().currentMessage}
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
                {isPaused ? '已暂停' : '运行中'}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">下次提醒</p>
              <p className="text-lg font-medium text-gray-800">
                {isPaused ? '已暂停' : formatRemainingTime(nextReminderSeconds)}
              </p>
            </div>

            <div className="text-xs text-gray-400 mt-6">点击系统托盘图标可显示此窗口</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
