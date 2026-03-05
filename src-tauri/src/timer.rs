use serde::{Deserialize, Serialize};
use chrono::Local;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum WorkMode {
    Working,
    Resting,
    BigResting,  // 大番茄休息模式
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub interval_minutes: f64,
    pub rest_duration_seconds: u64,        // 小番茄休息时间（默认20秒）
    pub big_tomato_rest_seconds: u64,     // 大番茄休息时间（默认15分钟=900秒）
    pub next_reminder_at: Option<u64>,     // Unix timestamp in seconds
    pub work_mode: WorkMode,
    pub small_tomato_count: u32,          // 小番茄计数（当天）
    pub big_tomato_count: u32,            // 大番茄计数（当天）
    pub last_date: String,                 // 上次记录的日期（YYYY-MM-DD）
}

impl Default for TimerState {
    fn default() -> Self {
        let today = Local::now().format("%Y-%m-%d").to_string();
        Self {
            interval_minutes: 20.0,
            rest_duration_seconds: 20,
            big_tomato_rest_seconds: 900,  // 15分钟
            next_reminder_at: None,
            work_mode: WorkMode::Working,
            small_tomato_count: 0,
            big_tomato_count: 0,
            last_date: today,
        }
    }
}

/// 检查是否需要重置番茄计数（跨日期）
pub fn check_date_reset(state: &mut TimerState) {
    let today = Local::now().format("%Y-%m-%d").to_string();
    if state.last_date != today {
        state.small_tomato_count = 0;
        state.big_tomato_count = 0;
        state.last_date = today;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_timer_state_default() {
        let state = TimerState::default();
        assert_eq!(state.interval_minutes, 20.0);
        assert_eq!(state.rest_duration_seconds, 20);
        assert_eq!(state.big_tomato_rest_seconds, 900);
        assert_eq!(state.work_mode, WorkMode::Working);
        assert_eq!(state.small_tomato_count, 0);
        assert_eq!(state.big_tomato_count, 0);
    }

    #[test]
    fn test_work_mode_working() {
        let mode = WorkMode::Working;
        assert!(matches!(mode, WorkMode::Working));
    }

    #[test]
    fn test_work_mode_resting() {
        let mode = WorkMode::Resting;
        assert!(matches!(mode, WorkMode::Resting));
    }

    #[test]
    fn test_work_mode_big_resting() {
        let mode = WorkMode::BigResting;
        assert!(matches!(mode, WorkMode::BigResting));
    }

    #[test]
    fn test_work_mode_partial_eq() {
        assert_eq!(WorkMode::Working, WorkMode::Working);
        assert_eq!(WorkMode::Resting, WorkMode::Resting);
        assert_eq!(WorkMode::BigResting, WorkMode::BigResting);
        assert_ne!(WorkMode::Working, WorkMode::Resting);
        assert_ne!(WorkMode::Resting, WorkMode::BigResting);
    }

    #[test]
    fn test_small_tomato_count_increment() {
        let mut state = TimerState::default();
        state.small_tomato_count = 1;
        assert_eq!(state.small_tomato_count, 1);
    }

    #[test]
    fn test_big_tomato_count_increment() {
        let mut state = TimerState::default();
        state.big_tomato_count = 2;
        assert_eq!(state.big_tomato_count, 2);
    }

    #[test]
    fn test_small_tomato_resets_after_big_rest() {
        let mut state = TimerState::default();
        state.small_tomato_count = 3;
        // After completing 4th small tomato, it becomes big rest
        // and small_tomato_count should reset to 0
        state.small_tomato_count += 1;
        if state.small_tomato_count >= 4 {
            state.big_tomato_count += 1;
            state.small_tomato_count = 0;
        }
        assert_eq!(state.small_tomato_count, 0);
        assert_eq!(state.big_tomato_count, 1);
    }

    #[test]
    fn test_check_date_reset_same_day() {
        let mut state = TimerState::default();
        let today = Local::now().format("%Y-%m-%d").to_string();
        state.last_date = today.clone();

        check_date_reset(&mut state);

        // Count should not reset on same day
        state.small_tomato_count = 5;
        state.big_tomato_count = 2;
        check_date_reset(&mut state);
        assert_eq!(state.small_tomato_count, 5);
        assert_eq!(state.big_tomato_count, 2);
    }

    #[test]
    fn test_big_tomato_rest_duration_default() {
        let state = TimerState::default();
        // Default is 15 minutes = 900 seconds
        assert_eq!(state.big_tomato_rest_seconds, 900);
    }

    #[test]
    fn test_work_mode_transitions() {
        // Test that work modes can be correctly set and compared
        let mut state = TimerState::default();

        // Start in working mode
        assert_eq!(state.work_mode, WorkMode::Working);

        // Transition to resting
        state.work_mode = WorkMode::Resting;
        assert_eq!(state.work_mode, WorkMode::Resting);

        // Transition back to working
        state.work_mode = WorkMode::Working;
        assert_eq!(state.work_mode, WorkMode::Working);

        // Transition to big resting
        state.work_mode = WorkMode::BigResting;
        assert_eq!(state.work_mode, WorkMode::BigResting);
    }
}
