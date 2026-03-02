use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum WorkMode {
    Working,
    Resting,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub interval_minutes: u64,
    pub rest_duration_seconds: u64,
    pub next_reminder_at: Option<u64>, // Unix timestamp in seconds
    pub work_mode: WorkMode,
}

impl Default for TimerState {
    fn default() -> Self {
        // Default to 20 minutes work, 20 seconds rest
        Self {
            interval_minutes: 20,
            rest_duration_seconds: 20,
            next_reminder_at: None,
            work_mode: WorkMode::Working,
        }
    }
}
