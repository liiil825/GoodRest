import { useEffect, useState } from 'react';
import { useReminderStore } from './stores/reminderStore';
import { useSettingsStore } from './stores/settingsStore';
import {
  listenToEvent, skipReminder, snoozeReminder,
  getNextReminderSeconds, getWorkMode,
  setWorkInterval, setRestDuration, setBigTomatoRestDuration,
  getInterval, getRestDuration, getBigTomatoRestDuration, getTomatoCounts,
  setRestMode, setWorkMode as setWindowWorkMode,
  playSoundByType, checkAudioExists
} from './lib/tauriEvents';
import { DEFAULT_REMINDER_MESSAGES, BIG_REST_MESSAGES, SNOOZE_OPTIONS, DEFAULT_INTERVAL_MINUTES, DEFAULT_REST_SECONDS } from './lib/constants';
import { SmallTomatoIcon, BigTomatoIcon } from './components/TomatoIcons';
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
  const {
    isPaused, setIsPaused,
    nextReminderSeconds, setNextReminderSeconds,
    workMode, setWorkMode,
    smallTomatoCount, setSmallTomatoCount,
    bigTomatoCount, setBigTomatoCount,
    currentPage, setCurrentPage,
    bigTomatoRestSeconds, setBigTomatoRestSeconds
  } = useSettingsStore();

  const [workMinutes, setWorkMinutes] = useState(DEFAULT_INTERVAL_MINUTES);
  const [restSeconds, setRestSeconds] = useState(DEFAULT_REST_SECONDS);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      const interval = await getInterval();
      const rest = await getRestDuration();
      const bigRest = await getBigTomatoRestDuration();

      // Check audio existence
      const workAudio = await checkAudioExists('work');
      const smallRestAudio = await checkAudioExists('small_rest');
      const bigRestAudio = await checkAudioExists('big_rest');

      // Get tomato counts
      const counts = await getTomatoCounts();

      setWorkMinutes(interval);
      setRestSeconds(rest);
      setBigTomatoRestSeconds(bigRest);
      useSettingsStore.getState().setWorkAudioSet(workAudio);
      useSettingsStore.getState().setSmallRestAudioSet(smallRestAudio);
      useSettingsStore.getState().setBigRestAudioSet(bigRestAudio);
      setSmallTomatoCount(counts.small);
      setBigTomatoCount(counts.big);
    };
    fetchSettings();
  }, []);

  // Fetch remaining time and work mode periodically
  useEffect(() => {
    const fetchData = async () => {
      const seconds = await getNextReminderSeconds();
      const mode = await getWorkMode();
      const counts = await getTomatoCounts();
      setNextReminderSeconds(seconds);
      setWorkMode(mode);
      setSmallTomatoCount(counts.small);
      setBigTomatoCount(counts.big);
    };

    // Initial fetch
    fetchData();

    // Update every second
    const timer = setInterval(fetchData, 1000);
    return () => clearInterval(timer);
  }, [setNextReminderSeconds, setWorkMode, setSmallTomatoCount, setBigTomatoCount]);

  useEffect(() => {
    // Listen for reminder events from Rust backend
    const unlistenShow = listenToEvent('show-reminder', () => {
      // Show message based on mode
      let message: string;
      if (workMode === 'big_resting') {
        message = BIG_REST_MESSAGES[Math.floor(Math.random() * BIG_REST_MESSAGES.length)];
      } else {
        message = DEFAULT_REMINDER_MESSAGES[Math.floor(Math.random() * DEFAULT_REMINDER_MESSAGES.length)];
      }
      showReminder(message);
    });

    const unlistenSkipped = listenToEvent('reminder-skipped', async () => {
      hideReminder();
      setWorkMode('working');
      await setWindowWorkMode();
      // Play work start sound
      const store = useSettingsStore.getState();
      if (store.workSoundEnabled) {
        await playSoundByType('work', store.workAudioSet);
      }
    });

    const unlistenSnoozed = listenToEvent('reminder-snoozed', async () => {
      hideReminder();
      setWorkMode('working');
      await setWindowWorkMode();
      // Play work start sound
      const store = useSettingsStore.getState();
      if (store.workSoundEnabled) {
        await playSoundByType('work', store.workAudioSet);
      }
    });

    // Work ended -> small rest started
    const unlistenWorkEnded = listenToEvent('work-ended', async () => {
      setWorkMode('resting');
      await setRestMode();
      // Play small rest sound - get latest state from store
      const store = useSettingsStore.getState();
      if (store.smallRestSoundEnabled) {
        await playSoundByType('small_rest', store.smallRestAudioSet);
      }
    });

    // Big rest started (4th small tomato completed)
    const unlistenBigRestStarted = listenToEvent('big-rest-started', async () => {
      setWorkMode('big_resting');
      await setRestMode();
      // Play big rest sound - get latest state from store
      const store = useSettingsStore.getState();
      if (store.bigRestSoundEnabled) {
        await playSoundByType('big_rest', store.bigRestAudioSet);
      }
    });

    // Rest ended -> work started
    const unlistenRestEnded = listenToEvent('rest-ended', async () => {
      setWorkMode('working');
      await setWindowWorkMode();
      hideReminder();
      // Play work start sound - get latest state from store
      const store = useSettingsStore.getState();
      if (store.workSoundEnabled) {
        await playSoundByType('work', store.workAudioSet);
      }
    });

    const unlistenPaused = listenToEvent('timer-paused', () => {
      setIsPaused(true);
    });

    const unlistenResumed = listenToEvent('timer-resumed', () => {
      setIsPaused(false);
    });

    const unlistenOpenSettings = listenToEvent('open-settings', () => {
      setCurrentPage('settings');
    });

    const unlistenOpenHome = listenToEvent('open-home', () => {
      setCurrentPage('home');
    });

    return () => {
      unlistenShow.then((fn: () => void) => fn());
      unlistenSkipped.then((fn: () => void) => fn());
      unlistenSnoozed.then((fn: () => void) => fn());
      unlistenWorkEnded.then((fn: () => void) => fn());
      unlistenBigRestStarted.then((fn: () => void) => fn());
      unlistenRestEnded.then((fn: () => void) => fn());
      unlistenPaused.then((fn: () => void) => fn());
      unlistenResumed.then((fn: () => void) => fn());
      unlistenOpenSettings.then((fn: () => void) => fn());
      unlistenOpenHome.then((fn: () => void) => fn());
    };
  }, [showReminder, hideReminder, setIsPaused, setWorkMode, setCurrentPage]);

  const handleSkip = async () => {
    await skipReminder();
    hideReminder();
  };

  const handleSnooze = async (minutes: number) => {
    await snoozeReminder(minutes);
    hideReminder();
  };

  const handleSaveSettings = async (workMins: number, restSecs: number, bigRestSecs: number) => {
    await setWorkInterval(workMins);
    await setRestDuration(restSecs);
    await setBigTomatoRestDuration(bigRestSecs);
    setWorkMinutes(workMins);
    setRestSeconds(restSecs);
    setBigTomatoRestSeconds(bigRestSecs);
  };

  // Show rest screen when in rest mode or big_resting mode
  const isResting = workMode === 'resting' || workMode === 'big_resting';

  // Get current rest duration based on mode
  const currentRestSeconds = workMode === 'big_resting' ? bigTomatoRestSeconds : restSeconds;

  const totalTomatoes = bigTomatoCount * 4 + smallTomatoCount;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-emerald-50/30 to-zinc-100 flex flex-col items-center justify-center p-4 transition-colors duration-500">
      {currentPage === 'settings' ? (
        <Settings
          workMinutes={workMinutes}
          restSeconds={restSeconds}
          bigRestSeconds={bigTomatoRestSeconds}
          onSave={handleSaveSettings}
        />
      ) : (
        /* Home page content */
        <div className="text-center w-full max-w-lg">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2 drop-shadow-sm">GoodRest</h1>
          <p className="text-slate-500 font-medium tracking-wide mb-8">让定时休息成为习惯</p>

          <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-white/60 border border-white/40 p-10 w-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            {/* Tomato progress */}
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-4">今日番茄</p>
              {totalTomatoes > 15 ? (
                <div className="flex items-center justify-center gap-2">
                  <BigTomatoIcon size={40} />
                  <span className="text-2xl font-bold text-gray-800">x {totalTomatoes}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {/* Big tomatoes */}
                  {Array.from({ length: bigTomatoCount }).map((_, i) => (
                    <div key={`big-${i}`} className="transform hover:scale-110 transition-transform duration-200"><BigTomatoIcon size={40} /></div>
                  ))}
                  {/* Small tomatoes */}
                  {Array.from({ length: smallTomatoCount }).map((_, i) => (
                    <div key={`small-${i}`} className="transform hover:scale-110 transition-transform duration-200"><SmallTomatoIcon size={32} /></div>
                  ))}
                  {bigTomatoCount === 0 && smallTomatoCount === 0 && (
                    <span className="text-slate-400 text-sm italic">暂无番茄，开始工作吧</span>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-2">状态</p>
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/50 ring-1 ring-slate-200/50 shadow-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${isPaused ? 'bg-amber-400' : workMode === 'working' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400 animate-pulse'}`}></div>
                <p
                  className={`text-sm font-bold tracking-wide ${isPaused ? 'text-amber-600' : workMode === 'working' ? 'text-emerald-600' : 'text-blue-600'}`}
                >
                  {isPaused ? '已暂停' : workMode === 'working' ? '工作中' : workMode === 'big_resting' ? '大休息中' : '小休息中'}
                </p>
              </div>
            </div>

            <div className="mb-10">
              <p className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-2">下次休息</p>
              <p className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 drop-shadow-sm tabular-nums tracking-tight">
                {isPaused ? '已暂停' : formatRemainingTime(nextReminderSeconds)}
              </p>
            </div>

            <button
              onClick={() => setCurrentPage('settings')}
              className="mt-2 px-8 py-3 text-sm font-semibold bg-white/60 hover:bg-white border border-slate-200/60 text-slate-600 shadow-sm hover:shadow-md hover:text-slate-800 rounded-2xl transition-all duration-300 active:scale-95"
            >
              配置设置
            </button>

            <div className="text-xs text-slate-400 mt-8 opacity-70">点击系统托盘图标可显示此窗口</div>
          </div>
        </div>
      )}
      {isResting || isShowing ? (
        <ReminderWindow
          message={useReminderStore.getState().currentMessage || '休息一下'}
          onSkip={handleSkip}
          onSnooze={handleSnooze}
          snoozeOptions={SNOOZE_OPTIONS}
          countdown={nextReminderSeconds}
          totalRestSeconds={currentRestSeconds}
        />
      ) : null}
    </div>
  );
}

export default App;
