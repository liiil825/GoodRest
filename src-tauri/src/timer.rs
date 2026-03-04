use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum WorkMode {
    Working,
    Resting,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub interval_minutes: f64,
    pub rest_duration_seconds: u64,
    pub next_reminder_at: Option<u64>, // Unix timestamp in seconds
    pub work_mode: WorkMode,
}

impl Default for TimerState {
    fn default() -> Self {
        // Default to 20 minutes work, 20 seconds rest
        Self {
            interval_minutes: 20.0,
            rest_duration_seconds: 20,
            next_reminder_at: None,
            work_mode: WorkMode::Working,
        }
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
        assert_eq!(state.work_mode, WorkMode::Working);
        assert!(state.next_reminder_at.is_none());
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
    fn test_work_mode_partial_eq() {
        assert_eq!(WorkMode::Working, WorkMode::Working);
        assert_eq!(WorkMode::Resting, WorkMode::Resting);
        assert_ne!(WorkMode::Working, WorkMode::Resting);
    }
}
