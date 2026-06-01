import { useEffect } from 'react';
import type { NotificationSettings } from '../services/notificationStorage';
import {
  isCheckedInToday,
  clearStaleCheckinFlags,
  clearCheckedInFlag,
} from '../services/notificationStorage';
import { sendNotification } from '../services/notificationService';

// ─── Time utilities ───────────────────────────────────────────────────────────

/** Returns milliseconds until the given HH:mm time today, or +24 h if already past (D-7). */
export function msUntilTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  let diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    // Time already passed today — schedule for tomorrow (D-7)
    diff += 24 * 60 * 60 * 1000;
  }
  return diff;
}

/** Returns milliseconds until the next local midnight. */
export function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages the client-side notification scheduler lifecycle.
 *
 * - Waits for auth to be ready (H-4).
 * - Clears stale check-in flags on init (D-6 / M-3).
 * - Clamps negative delay to +24 h (D-7).
 * - Re-schedules when `settings` changes (H-3) via the effect dependency array.
 * - Cleans up all pending timeouts on unmount or re-run.
 */
export function useNotificationScheduler(
  userId: number | null,
  isAuthLoading: boolean,
  settings: NotificationSettings,
): void {
  useEffect(() => {
    // H-4: Do not run until auth rehydration is complete and user is known
    if (isAuthLoading || userId === null || !settings.enabled) return;

    // M-3 / D-6: Clear any check-in flags from prior days before evaluating
    clearStaleCheckinFlags(userId);

    let notifId: ReturnType<typeof setTimeout> | null = null;
    let midnightId: ReturnType<typeof setTimeout> | null = null;

    function cancelAll() {
      if (notifId !== null) {
        clearTimeout(notifId);
        notifId = null;
      }
      if (midnightId !== null) {
        clearTimeout(midnightId);
        midnightId = null;
      }
    }

    function scheduleMidnightReset() {
      midnightId = setTimeout(() => {
        clearCheckedInFlag(userId!);
        // Reschedule notification for tomorrow at the configured time
        scheduleNotification();
      }, msUntilMidnight());
    }

    function scheduleNotification() {
      const delay = msUntilTime(settings.time);
      notifId = setTimeout(() => {
        // Re-check suppression at the moment the timeout fires
        if (!isCheckedInToday(userId!)) {
          sendNotification(
            'Time to check in!',
            "Don't forget to log your wellbeing today.",
          );
        }
        scheduleMidnightReset();
      }, delay);
    }

    if (isCheckedInToday(userId)) {
      // Already checked in today — skip the notification and only set midnight reset
      scheduleMidnightReset();
    } else {
      scheduleNotification();
    }

    // Cleanup: cancel all pending timeouts when deps change or component unmounts
    return cancelAll;
  }, [userId, isAuthLoading, settings.enabled, settings.time]);
}
