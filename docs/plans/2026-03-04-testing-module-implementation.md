# Testing Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add lightweight test coverage for frontend stores and backend timer logic using Vitest and native Rust tests.

**Architecture:** Frontend tests in `src/__tests__/` using Vitest, backend tests in `src-tauri/src/timer.rs` using native Rust test modules.

**Tech Stack:** Vitest (frontend), Rust native `#[test]` (backend)

---

## Task 1: Add Vitest to package.json

**Files:**
- Modify: `package.json`

**Step 1: Add test script and vitest dependency**

Run: `pnpm add -D vitest`

**Step 2: Add test script to package.json**

Modify `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add vitest for frontend testing"
```

---

## Task 2: Create reminderStore test

**Files:**
- Create: `src/__tests__/reminderStore.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/reminderStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useReminderStore } from '../stores/reminderStore';

describe('reminderStore', () => {
  beforeEach(() => {
    useReminderStore.setState({
      isShowing: false,
      currentMessage: '',
    });
  });

  it('initial state is not showing reminder', () => {
    const { isShowing, currentMessage } = useReminderStore.getState();
    expect(isShowing).toBe(false);
    expect(currentMessage).toBe('');
  });

  it('showReminder sets isShowing to true and stores message', () => {
    const { showReminder } = useReminderStore.getState();
    showReminder('测试消息');
    const { isShowing, currentMessage } = useReminderStore.getState();
    expect(isShowing).toBe(true);
    expect(currentMessage).toBe('测试消息');
  });

  it('hideReminder resets isShowing to false and clears message', () => {
    // First show a reminder
    useReminderStore.setState({ isShowing: true, currentMessage: '测试消息' });

    const { hideReminder } = useReminderStore.getState();
    hideReminder();
    const { isShowing, currentMessage } = useReminderStore.getState();
    expect(isShowing).toBe(false);
    expect(currentMessage).toBe('');
  });
});
```

**Step 2: Run test to verify it runs**

Run: `pnpm test run src/__tests__/reminderStore.test.ts`
Expected: PASS (Zustand store is simple enough to pass)

**Step 3: Commit**

```bash
git add src/__tests__/reminderStore.test.ts
git commit -m "test: add reminderStore unit tests"
```

---

## Task 3: Create settingsStore test

**Files:**
- Create: `src/__tests__/settingsStore.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/settingsStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../stores/settingsStore';
import { DEFAULT_INTERVAL_MINUTES } from '../lib/constants';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      intervalMinutes: DEFAULT_INTERVAL_MINUTES,
      isPaused: false,
      nextReminderSeconds: null,
      workMode: 'working',
      soundEnabled: true,
      soundFilePath: null,
      notification: null,
    });
  });

  it('initial state has correct default values', () => {
    const state = useSettingsStore.getState();
    expect(state.intervalMinutes).toBe(DEFAULT_INTERVAL_MINUTES);
    expect(state.isPaused).toBe(false);
    expect(state.workMode).toBe('working');
    expect(state.soundEnabled).toBe(true);
  });

  it('setInterval updates intervalMinutes', () => {
    const { setInterval } = useSettingsStore.getState();
    setInterval(30);
    expect(useSettingsStore.getState().intervalMinutes).toBe(30);
  });

  it('setIsPaused updates isPaused state', () => {
    const { setIsPaused } = useSettingsStore.getState();
    setIsPaused(true);
    expect(useSettingsStore.getState().isPaused).toBe(true);
    setIsPaused(false);
    expect(useSettingsStore.getState().isPaused).toBe(false);
  });

  it('setWorkMode updates workMode state', () => {
    const { setWorkMode } = useSettingsStore.getState();
    setWorkMode('resting');
    expect(useSettingsStore.getState().workMode).toBe('resting');
    setWorkMode('working');
    expect(useSettingsStore.getState().workMode).toBe('working');
  });

  it('setNextReminderSeconds updates countdown', () => {
    const { setNextReminderSeconds } = useSettingsStore.getState();
    setNextReminderSeconds(300);
    expect(useSettingsStore.getState().nextReminderSeconds).toBe(300);
  });

  it('setSoundFilePath updates sound file path', () => {
    const { setSoundFilePath } = useSettingsStore.getState();
    setSoundFilePath('/path/to/sound.mp3');
    expect(useSettingsStore.getState().soundFilePath).toBe('/path/to/sound.mp3');
  });
});
```

**Step 2: Run test to verify it runs**

Run: `pnpm test run src/__tests__/settingsStore.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/settingsStore.test.ts
git commit -m "test: add settingsStore unit tests"
```

---

## Task 4: Create constants test

**Files:**
- Create: `src/__tests__/constants.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/constants.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_INTERVAL_MINUTES,
  DEFAULT_REST_SECONDS,
  DEFAULT_REMINDER_MESSAGES,
  SNOOZE_OPTIONS,
} from '../lib/constants';

describe('constants', () => {
  it('DEFAULT_INTERVAL_MINUTES should be 20', () => {
    expect(DEFAULT_INTERVAL_MINUTES).toBe(20);
  });

  it('DEFAULT_REST_SECONDS should be 20', () => {
    expect(DEFAULT_REST_SECONDS).toBe(20);
  });

  it('DEFAULT_REMINDER_MESSAGES should not be empty', () => {
    expect(DEFAULT_REMINDER_MESSAGES.length).toBeGreaterThan(0);
  });

  it('SNOOZE_OPTIONS should contain expected values', () => {
    expect(SNOOZE_OPTIONS).toContain(1);
    expect(SNOOZE_OPTIONS).toContain(3);
    expect(SNOOZE_OPTIONS).toContain(5);
    expect(SNOOZE_OPTIONS).toContain(10);
  });
});
```

**Step 2: Run test to verify it runs**

Run: `pnpm test run src/__tests__/constants.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/constants.test.ts
git commit -m "test: add constants unit tests"
```

---

## Task 5: Add Rust timer tests

**Files:**
- Modify: `src-tauri/src/timer.rs`

**Step 1: Add test module to timer.rs**

Add at the end of `src-tauri/src/timer.rs`:

```rust
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
```

**Step 2: Run tests to verify they pass**

Run: `cd src-tauri && cargo test`
Expected: PASS

**Step 3: Commit**

```bash
git add src-tauri/src/timer.rs
git commit -m "test: add timer.rs unit tests"
```

---

## Task 6: Verify all tests pass

**Step 1: Run all frontend tests**

Run: `pnpm test run`
Expected: PASS (all 3 test files)

**Step 2: Run all backend tests**

Run: `cd src-tauri && cargo test`
Expected: PASS (all timer tests)

**Step 3: Commit**

```bash
git add -A
git commit -m "test: add complete test module for frontend and backend"
```
