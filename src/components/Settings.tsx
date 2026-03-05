import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { selectAudioFile, copyAudioFileByType, playSoundByType, pauseSound, isPlaying, stopSound, AudioType } from '../lib/tauriEvents';

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

    if (isPlaying() && currentPlayingType === audioType) {
      pauseSound();
      setIsAudioPlaying(false);
    } else {
      // Stop any currently playing audio
      stopSound();
      setIsAudioPlaying(false);

      await playSoundByType(audioType, audioSet);
      setIsAudioPlaying(true);
      setCurrentPlayingType(audioType);
      // Auto-reset button after audio ends (approximate)
      setTimeout(() => {
        setIsAudioPlaying(false);
        setCurrentPlayingType(null);
      }, 3000);
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
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <div
          className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
            soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
            } mt-0.5`}
          />
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {audioSet ? '自定义音频' : '默认音效'}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handlePlayPause(audioType, audioSet, soundEnabled)}
          disabled={!soundEnabled}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            soundEnabled
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isAudioPlaying && currentPlayingType === audioType ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button
          onClick={() => handleSelectSound(audioType)}
          disabled={!soundEnabled}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            soundEnabled
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          选择文件
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">
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

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {/* Tab buttons */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('time')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'time'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              时间
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'audio'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              音频
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

          {/* Tab Content - always render both, control visibility with CSS */}
          <div className="min-h-[280px]">
            {/* Time Tab Content */}
            <div className={activeTab === 'time' ? 'block' : 'hidden'}>
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
                    />
                    <span className="text-xs text-gray-500">秒</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">小番茄休息时间</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={restMins}
                      onChange={(e) => setRestMins(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    />
                    <span className="text-xs text-gray-500">秒</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">大番茄休息时间</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={bigRestMins}
                      onChange={(e) => setBigRestMins(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">分钟</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={bigRestSecs}
                      onChange={(e) => setBigRestSecs(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">秒</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                4个小番茄 = 1个大番茄，大番茄后有更长的休息时间
              </p>
            </div>

            {/* Audio Tab Content */}
            <div className={activeTab === 'audio' ? 'block' : 'hidden'}>
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
          <div className="flex gap-3 justify-end mt-6">
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
