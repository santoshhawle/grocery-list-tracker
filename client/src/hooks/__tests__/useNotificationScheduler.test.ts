import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotificationScheduler, msUntilTime, msUntilMidnight } from '../useNotificationScheduler';
import type { NotificationSettings } from '../../services/notificationStorage';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockIsCheckedInToday = vi.fn<(userId: number) => boolean>().mockReturnValue(false);
const mockClearStaleCheckinFlags = vi.fn<(userId: number) => void>();
const mockClearCheckedInFlag = vi.fn<(userId: number) => void>();
const mockSendNotification = vi.fn<(title: string, body: string) => void>();

vi.mock('../../services/notificationStorage', () => ({
  isCheckedInToday: (userId: number) => mockIsCheckedInToday(userId),
  clearStaleCheckinFlags: (userId: number) => mockClearStaleCheckinFlags(userId),
  clearCheckedInFlag: (userId: number) => mockClearCheckedInFlag(userId),
}));

vi.mock('../../services/notificationService', () => ({
  sendNotification: (title: string, body: string) => mockSendNotification(title, body),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 7;
const ENABLED_SETTINGS: NotificationSettings = { enabled: true, time: '09:00' };
const DISABLED_SETTINGS: NotificationSettings = { enabled: false, time: '09:00' };

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  mockIsCheckedInToday.mockReturnValue(false);
  mockClearStaleCheckinFlags.mockReset();
  mockClearCheckedInFlag.mockReset();
  mockSendNotification.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ─── msUntilTime utility ──────────────────────────────────────────────────────

describe('msUntilTime', () => {
  it('returns positive ms when target time is in the future today', () => {
    // Set "now" to 08:00
    vi.setSystemTime(new Date('2026-05-15T08:00:00'));
    const ms = msUntilTime('09:00');
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(60 * 60 * 1000); // ≤ 1 hour
  });

  it('clamps to +24 h when target time has already passed today (D-7)', () => {
    // Set "now" to 10:00 — target 09:00 has passed
    vi.setSystemTime(new Date('2026-05-15T10:00:00'));
    const ms = msUntilTime('09:00');
    const hours = ms / (60 * 60 * 1000);
    expect(hours).toBeGreaterThan(22);  // somewhere around 23 hours away
    expect(hours).toBeLessThanOrEqual(24);
  });
});

// ─── msUntilMidnight utility ──────────────────────────────────────────────────

describe('msUntilMidnight', () => {
  it('returns ms remaining until local midnight', () => {
    vi.setSystemTime(new Date('2026-05-15T23:00:00'));
    const ms = msUntilMidnight();
    expect(ms).toBeCloseTo(60 * 60 * 1000, -3); // ~1 hour
  });
});

// ─── useNotificationScheduler ─────────────────────────────────────────────────

describe('useNotificationScheduler', () => {
  it('does not schedule when userId is null (H-4)', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    renderHook(() => useNotificationScheduler(null, false, ENABLED_SETTINGS));
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('does not schedule when isAuthLoading is true (H-4)', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    renderHook(() => useNotificationScheduler(USER_ID, true, ENABLED_SETTINGS));
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('does not schedule when settings.enabled is false', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    renderHook(() => useNotificationScheduler(USER_ID, false, DISABLED_SETTINGS));
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('clears stale check-in flags on init (M-3 / D-6)', () => {
    vi.setSystemTime(new Date('2026-05-15T08:00:00'));
    renderHook(() => useNotificationScheduler(USER_ID, false, ENABLED_SETTINGS));
    expect(mockClearStaleCheckinFlags).toHaveBeenCalledWith(USER_ID);
  });

  it('schedules a notification timeout when user is not checked in', () => {
    vi.setSystemTime(new Date('2026-05-15T08:00:00'));
    mockIsCheckedInToday.mockReturnValue(false);
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    renderHook(() => useNotificationScheduler(USER_ID, false, ENABLED_SETTINGS));

    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  it('fires sendNotification after the scheduled delay', () => {
    vi.setSystemTime(new Date('2026-05-15T08:59:00'));
    mockIsCheckedInToday.mockReturnValue(false);

    renderHook(() => useNotificationScheduler(USER_ID, false, { enabled: true, time: '09:00' }));

    vi.advanceTimersByTime(61 * 1000); // advance past 09:00
    expect(mockSendNotification).toHaveBeenCalledWith(
      'Time to check in!',
      "Don't forget to log your wellbeing today.",
    );
  });

  it('does NOT fire sendNotification when already checked in (suppression)', () => {
    vi.setSystemTime(new Date('2026-05-15T08:59:00'));
    // Already checked in — return true at fire time too
    mockIsCheckedInToday.mockReturnValue(true);

    renderHook(() => useNotificationScheduler(USER_ID, false, { enabled: true, time: '09:00' }));

    vi.advanceTimersByTime(61 * 1000);
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('cancels pending timeouts on unmount (cleanup)', () => {
    vi.setSystemTime(new Date('2026-05-15T08:00:00'));
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = renderHook(() =>
      useNotificationScheduler(USER_ID, false, ENABLED_SETTINGS),
    );

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('cancels and reschedules when settings change (H-3)', () => {
    vi.setSystemTime(new Date('2026-05-15T08:00:00'));
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { rerender } = renderHook(
      ({ s }: { s: NotificationSettings }) =>
        useNotificationScheduler(USER_ID, false, s),
      { initialProps: { s: { enabled: true, time: '09:00' } } },
    );

    // Change time → old effect should clean up (clearTimeout called)
    rerender({ s: { enabled: true, time: '10:00' } });
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('skips notification but schedules midnight reset when already checked in', () => {
    vi.setSystemTime(new Date('2026-05-15T08:00:00'));
    mockIsCheckedInToday.mockReturnValue(true);
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    renderHook(() => useNotificationScheduler(USER_ID, false, ENABLED_SETTINGS));

    // Only midnight reset should be scheduled (1 call), not a notification timeout
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
