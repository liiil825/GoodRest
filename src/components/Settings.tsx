import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { selectAudioFile, copyAudioFileByType, playSoundByType, stopAudioByRust, stopSound, AudioType } from '../lib/tauriEvents';

interface SettingsProps {
  workMinutes: number;
  restSeconds: number;
  bigRestSeconds: number;
  onSave: (workMinutes: number, restSeconds: number, bigRestSeconds: number) => void;
}

function Settings({ workMinutes, restSeconds, bigRestSeconds, onSave }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'time' | 'audio'>('time');
  const [workMins, setWorkMins] = useState(0);
  const [workSecs, setWorkSecs] = useState(0);
  const [restMins, setRestMins] = useState(0);
  const [restSecs, setRestSecs] = useState(0);
  const [bigRestMins, setBigRestMins] = useState(15);
  const [bigRestSecs, setBigRestSecs] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentPlayingType, setCurrentPlayingType] = useState<AudioType | null>(null);

  const {
    notification, setNotification,
    workSoundEnabled, setWorkSoundEnabled,
    smallRestSoundEnabled, setSmallRestSoundEnabled,
    bigRestSoundEnabled, setBigRestSoundEnabled,
    workAudioSet, setWorkAudioSet,
    smallRestAudioSet, setSmallRestAudioSet,
    bigRestAudioSet, setBigRestAudioSet,
    setCurrentPage
  } = useSettingsStore();

  useEffect(() => {
    setWorkMins(Math.floor(workMinutes));
    setWorkSecs(Math.floor((workMinutes % 1) * 60));
    setRestMins(Math.floor(restSeconds / 60));
    setRestSecs(restSeconds % 60);
    setBigRestMins(Math.floor(bigRestSeconds / 60));
    setBigRestSecs(bigRestSeconds % 60);
  }, [workMinutes, restSeconds, bigRestSeconds]);

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

  const handleSelectSound = async (audioType: AudioType) => {
    console.log(`[Settings] Opening audio file dialog for ${audioType}...`);
    try {
      const file = await selectAudioFile();
      console.log('[Settings] Selected file:', file);
      if (file) {
        console.log(`[Settings] Copying audio file for ${audioType}...`);
        const destPath = await copyAudioFileByType(file, audioType);
        console.log('[Settings] Copied to:', destPath);
        if (destPath) {
          // Update the corresponding audio set state
          if (audioType === 'work') {
            setWorkAudioSet(true);
          } else if (audioType === 'small_rest') {
            setSmallRestAudioSet(true);
          } else if (audioType === 'big_rest') {
            setBigRestAudioSet(true);
          }
          setNotification('音频文件已设置');
        } else {
          setNotification('音频文件复制失败');
        }
      } else {
        console.log('[Settings] No file selected');
      }
    } catch (error) {
      console.error('[Settings] Error selecting audio:', error);
      setNotification('选择音频失败');
    }
  };

  const handlePlayPause = async (audioType: AudioType, audioSet: boolean, soundEnabled: boolean) => {
    if (!soundEnabled) return;

    // If this audio type is currently "playing" (tracked by frontend state), stop it
    if (isAudioPlaying && currentPlayingType === audioType) {
      // Stop Rust audio immediately
      await stopAudioByRust();
      stopSound(); // Clear frontend state
      setIsAudioPlaying(false);
      setCurrentPlayingType(null);
    } else {
      // Stop any currently playing audio (via Rust singleton - new play stops old)
      await stopAudioByRust();
      stopSound(); // Clear frontend state

      await playSoundByType(audioType, audioSet);
      setIsAudioPlaying(true);
      setCurrentPlayingType(audioType);
      // Auto-reset button after audio ends (approximate - Rust plays to completion)
      setTimeout(() => {
        setIsAudioPlaying(false);
        setCurrentPlayingType(null);
      }, 5000);
    }
  };

  const handleSave = () => {
    const totalWorkSeconds = workMins * 60 + workSecs;
    const totalRestSeconds = restMins * 60 + restSecs;
    const totalBigRestSeconds = bigRestMins * 60 + bigRestSecs;

    if (totalWorkSeconds > 0 && totalRestSeconds > 0 && totalBigRestSeconds > 0) {
      const workMinutesDecimal = totalWorkSeconds / 60;
      onSave(workMinutesDecimal, totalRestSeconds, totalBigRestSeconds);
      setNotification('设置已保存');
      setTimeout(() => setCurrentPage('home'), 500);
    }
  };

  const handleCancel = () => {
    setNotification('已取消');
    setCurrentPage('home');
  };

  // Render audio setting item
  const renderAudioItem = (
    title: string,
    audioType: AudioType,
    audioSet: boolean,
    _setAudioSet: (v: boolean) => void,
    soundEnabled: boolean,
    setSoundEnabled: (v: boolean) => void
  ) => (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <button
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          onClick={() => setSoundEnabled(!soundEnabled)}
          role="switch"
          aria-checked={soundEnabled}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
          />
        </button>
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {audioSet ? '自定义音频' : '默认音效'}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handlePlayPause(audioType, audioSet, soundEnabled)}
          disabled={!soundEnabled}
          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm ${soundEnabled
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
        >
          {isAudioPlaying && currentPlayingType === audioType ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button
          onClick={() => handleSelectSound(audioType)}
          disabled={!soundEnabled}
          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm border ${soundEnabled
              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95'
              : 'bg-slate-50 border-transparent text-slate-400 cursor-not-allowed'
            }`}
        >
          选择文件
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-emerald-50/30 to-zinc-100 p-4 py-8 flex items-center justify-center transition-colors duration-500">
      <div className="w-full max-w-lg pb-10">
        {/* Header with back button */}
        <div className="flex items-center mb-8 px-2">
          <button
            onClick={() => setCurrentPage('home')}
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/60 hover:bg-white text-slate-600 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <span className="transform transition-transform group-hover:-translate-x-1">←</span>
          </button>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight ml-4 relative">
            配置设置
            <div className="absolute -bottom-1 left-0 w-1/2 h-1 bg-emerald-400 rounded-full opacity-50"></div>
          </h2>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 p-8 sm:p-10 relative overflow-hidden">
          {/* Decorative background element inside card */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          {/* Segmented Control Tabs */}
          <div className="relative flex p-1 mb-8 bg-slate-100/80 rounded-2xl shadow-inner backdrop-blur-sm border border-slate-200/50">
            {/* Sliding background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-in-out ${activeTab === 'time' ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
                }`}
            ></div>

            <button
              onClick={() => setActiveTab('time')}
              className={`relative flex-1 py-2.5 text-center text-sm font-semibold transition-colors duration-200 z-10 ${activeTab === 'time'
                  ? 'text-slate-800'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              时间设置
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`relative flex-1 py-2.5 text-center text-sm font-semibold transition-colors duration-200 z-10 ${activeTab === 'audio'
                  ? 'text-slate-800'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              音频设置
            </button>
          </div>

          {/* Notification */}
          <div className="min-h-[40px] mb-2">
            {notification && (
              <div className="p-2 bg-green-100 text-green-700 rounded-lg text-center text-sm">
                {notification}
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="min-h-[280px] relative z-10">
            {/* Time Tab Content */}
            <div className={`transition-all duration-300 ${activeTab === 'time' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'}`}>

              {/* Common input styling classes */}
              {(() => {
                const labelClass = "block text-xs uppercase tracking-widest font-semibold text-slate-500 mb-2";
                const inputClass = "w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-slate-700 font-medium font-mono text-center";
                const unitClass = "absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 uppercase tracking-widest pointer-events-none";
                const inputWrapperClass = "relative flex-1 group";

                return (
                  <>
                    <div className="mb-6">
                      <label className={labelClass}>工作时长</label>
                      <div className="flex gap-3">
                        <div className={inputWrapperClass}>
                          <input type="number" min="0" max="120" value={workMins} onChange={(e) => setWorkMins(Number(e.target.value))} className={inputClass} />
                          <span className={unitClass}>分</span>
                        </div>
                        <div className={inputWrapperClass}>
                          <input type="number" min="0" max="59" value={workSecs} onChange={(e) => setWorkSecs(Number(e.target.value))} className={inputClass} />
                          <span className={unitClass}>秒</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className={labelClass}>小憩时长 (每个番茄后)</label>
                      <div className="flex gap-3">
                        <div className={inputWrapperClass}>
                          <input type="number" min="0" max="60" value={restMins} onChange={(e) => setRestMins(Number(e.target.value))} className={inputClass} />
                          <span className={unitClass}>分</span>
                        </div>
                        <div className={inputWrapperClass}>
                          <input type="number" min="0" max="59" value={restSecs} onChange={(e) => setRestSecs(Number(e.target.value))} className={inputClass} />
                          <span className={unitClass}>秒</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className={labelClass}>长休时长 (4个番茄后)</label>
                      <div className="flex gap-3">
                        <div className={inputWrapperClass}>
                          <input type="number" min="0" max="60" value={bigRestMins} onChange={(e) => setBigRestMins(Number(e.target.value))} className={inputClass} />
                          <span className={unitClass}>分</span>
                        </div>
                        <div className={inputWrapperClass}>
                          <input type="number" min="0" max="59" value={bigRestSecs} onChange={(e) => setBigRestSecs(Number(e.target.value))} className={inputClass} />
                          <span className={unitClass}>秒</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="mt-8 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <div className="text-emerald-500 mt-0.5">💡</div>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium opacity-80">
                  工作 4 个小番茄后，将自动进入长休模式。<br />合理的休息能让你更专注。
                </p>
              </div>
            </div>

            {/* Audio Tab Content */}
            <div className={`transition-all duration-300 ${activeTab === 'audio' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'}`}>
              {renderAudioItem(
                '工作开始',
                'work',
                workAudioSet,
                setWorkAudioSet,
                workSoundEnabled,
                setWorkSoundEnabled
              )}
              {renderAudioItem(
                '小番茄休息',
                'small_rest',
                smallRestAudioSet,
                setSmallRestAudioSet,
                smallRestSoundEnabled,
                setSmallRestSoundEnabled
              )}
              {renderAudioItem(
                '大番茄休息',
                'big_rest',
                bigRestAudioSet,
                setBigRestAudioSet,
                bigRestSoundEnabled,
                setBigRestSoundEnabled
              )}

              <p className="text-xs text-gray-400 mt-4">
                每个音频可独立开关和设置
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end mt-10 pt-6 border-t border-slate-100">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow active:scale-95"
            >
              取消更改
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
