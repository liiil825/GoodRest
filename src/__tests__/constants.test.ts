import { describe, it, expect } from 'vitest';
import {
  DEFAULT_INTERVAL_MINUTES,
  DEFAULT_REST_SECONDS,
  DEFAULT_BIG_REST_SECONDS,
  SMALL_TOMATOES_PER_BIG,
  DEFAULT_REMINDER_MESSAGES,
  BIG_REST_MESSAGES,
  SNOOZE_OPTIONS,
  DEFAULT_SOUND_ENABLED,
} from '../lib/constants';

describe('constants', () => {
  it('DEFAULT_INTERVAL_MINUTES should be 20', () => {
    expect(DEFAULT_INTERVAL_MINUTES).toBe(20);
  });

  it('DEFAULT_REST_SECONDS should be 20', () => {
    expect(DEFAULT_REST_SECONDS).toBe(20);
  });

  it('DEFAULT_BIG_REST_SECONDS should be 900 (15 minutes)', () => {
    expect(DEFAULT_BIG_REST_SECONDS).toBe(900);
  });

  it('SMALL_TOMATOES_PER_BIG should be 4', () => {
    expect(SMALL_TOMATOES_PER_BIG).toBe(4);
  });

  it('DEFAULT_REMINDER_MESSAGES should not be empty', () => {
    expect(DEFAULT_REMINDER_MESSAGES.length).toBeGreaterThan(0);
  });

  it('BIG_REST_MESSAGES should not be empty', () => {
    expect(BIG_REST_MESSAGES.length).toBeGreaterThan(0);
  });

  it('SNOOZE_OPTIONS should contain expected values', () => {
    expect(SNOOZE_OPTIONS).toContain(1);
    expect(SNOOZE_OPTIONS).toContain(3);
    expect(SNOOZE_OPTIONS).toContain(5);
    expect(SNOOZE_OPTIONS).toContain(10);
  });

  it('DEFAULT_SOUND_ENABLED should be true', () => {
    expect(DEFAULT_SOUND_ENABLED).toBe(true);
  });

  it('4 small tomatoes should equal 1 big tomato', () => {
    const smallTomatoes = 4;
    const bigTomatoes = Math.floor(smallTomatoes / SMALL_TOMATOES_PER_BIG);
    expect(bigTomatoes).toBe(1);
  });

  it('3 small tomatoes should not equal 1 big tomato', () => {
    const smallTomatoes = 3;
    const bigTomatoes = Math.floor(smallTomatoes / SMALL_TOMATOES_PER_BIG);
    expect(bigTomatoes).toBe(0);
  });
});
