# 设置界面音频 Tab 设计方案

## 概述

将设置界面拆分为"时间"和"音频"两个 Tab，并优化音频管理逻辑，使用固定的音频文件路径。

## 1. 整体架构

```
设置界面
├── Tab 1: 时间
│   ├── 工作时间（分、秒）
│   └── 休息时间（分、秒）
└── Tab 2: 音频
    ├── 启用开关
    ├── 当前音频显示
    ├── [播放/暂停] 按钮
    └── [选择文件] 按钮
```

## 2. 数据存储

### 音频目录

- **路径**：`{用户数据目录}/GoodRest/audio/rest.mp3`
  - macOS: `~/Library/Application Support/GoodRest/audio/rest.mp3`
  - Windows: `%APPDATA%\GoodRest\audio\rest.mp3`
  - Linux: `~/.config/GoodRest/audio/rest.mp3`

### 存储状态

- `soundEnabled`: boolean - 是否启用音效
- `customAudioSet`: boolean - 是否设置了自定义音频

## 3. 交互流程

### 选择音频文件

1. 用户点击"选择文件"，打开系统文件选择器
2. 用户选择音频文件（mp3/wav/ogg）
3. 后端将文件复制到 `{用户数据目录}/GoodRest/audio/rest.mp3`
4. 前端更新状态，显示"自定义音频"
5. 用户可以点击"播放"按钮预览

### 播放/暂停逻辑

- 点击播放：创建 Audio 对象开始播放，按钮变为"暂停"
- 音频播放完毕：按钮变回"播放"
- 播放中点击暂停：停止播放，按钮变回"播放"
- 播放新音频：先停止当前播放，再播放新音频

## 4. 组件变更

### 前端

- `Settings.tsx`: 添加 Tab 切换，拆分时间/音频设置
- `settingsStore.ts`: 添加 `customAudioSet` 状态
- `tauriEvents.ts`:
  - 添加 `copyAudioToAppData()` - 复制音频文件到应用数据目录
  - 添加 `getAudioPath()` - 获取音频文件路径
  - 修改 `playSound()` - 使用固定路径播放

### 后端 (Rust)

- `copy_audio_file(source_path: String) -> Result<String, String>` - 复制音频到应用数据目录
- `get_audio_path() -> Result<String, String>` - 获取音频文件路径

## 5. UI 设计

### 时间 Tab

保持原有的工作时间、休息时间输入框布局。

### 音频 Tab

```
┌─────────────────────────────────────┐
│  启用音效                    [开关]  │
│                                     │
│  当前音频：自定义音频               │
│                                     │
│  [▶ 播放]    [选择文件]            │
└─────────────────────────────────────┘
```

- 未设置自定义音频时显示："当前音频：默认音效"
- 播放按钮状态：播放中显示 "⏸ 暂停"，停止时显示 "▶ 播放"
