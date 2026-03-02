use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub interval_minutes: u64,
    pub next_reminder_at: Option<u64>, // Unix timestamp in seconds
}

impl Default for TimerState {
    fn default() -> Self {
        // Default to 20 minutes (as per project requirements)
        Self {
            interval_minutes: 20,
            next_reminder_at: None,
        }
    }
}
