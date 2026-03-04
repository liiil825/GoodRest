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
