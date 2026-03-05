# 番茄工作法功能设计

## 需求概述

基于番茄工作法重构休息提醒应用，增加小番茄和大番茄的概念，以及多个独立音频设置。

## 需求详情

1. **番茄工作法**
   - 小番茄 = 1次工作 + 1次休息
   - 大番茄 = 4个小番茄
   - 大番茄休息时间独立设置，默认15分钟

2. **番茄计数**
   - 按日期重置（每天从1开始）
   - 主界面显示已完成的番茄数

3. **音频设置**
   - 工作开始音频
   - 小番茄休息音频
   - 大番茄休息音频
   - 每个音频独立开关、单独选择文件

## 技术设计

### 1. Rust 后端 (timer.rs)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum WorkMode {
    Working,
    Resting,
    BigResting,  // 大番茄休息
}

pub struct TimerState {
    pub interval_minutes: f64,
    pub rest_duration_seconds: u64,        // 小番茄休息时间
    pub big_tomato_rest_seconds: u64,     // 大番茄休息时间（默认15分钟）
    pub next_reminder_at: Option<u64>,
    pub work_mode: WorkMode,
    pub small_tomato_count: u32,          // 小番茄计数（当天）
    pub last_date: String,                // 上次日期（YYYY-MM-DD）
}
```

### 2. 前端状态 (settingsStore.ts)

```typescript
interface SettingsState {
  // 番茄计数
  smallTomatoCount: number;
  bigTomatoCount: number;

  // 时间设置
  bigTomatoRestSeconds: number;

  // 3个音频开关
  workSoundEnabled: boolean;
  smallRestSoundEnabled: boolean;
  bigRestSoundEnabled: boolean;
}
```

### 3. 计时器逻辑

- 工作结束 → 小番茄计数+1，检查是否达到4个
- 达到4个小番茄 → 触发大番茄休息（使用 big_tomato_rest_seconds）
- 每次休息结束 → 检查日期，变化则重置计数
- 进入工作/休息模式时 → 播放对应音频

### 4. 音频文件存储

- `audio/work.mp3` - 工作开始音频
- `audio/small_rest.mp3` - 小休息音频
- `audio/big_rest.mp3` - 大休息音频

### 5. 前端界面

- **主界面**：添加番茄进度显示
- **设置-音频Tab**：3组音频设置（开关+选择+播放）
