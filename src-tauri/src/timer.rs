use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub interval_minutes: u64,
}

impl Default for TimerState {
    fn default() -> Self {
        // Default to 20 minutes (as per project requirements)
        Self {
            interval_minutes: 20,
        }
    }
}
