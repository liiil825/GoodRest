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
