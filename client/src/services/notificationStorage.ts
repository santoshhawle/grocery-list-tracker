// ─── Types ───────────────────────────────────────────────────────────────────

export interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:mm
}

export interface WriteResult {
  success: boolean;
}

// ─── Key helpers ─────────────────────────────────────────────────────────────

const settingsKey = (userId: number): string =>
  `wbt_notif_settings_${userId}`;

const checkinKey = (userId: number, date: string): string =>
  `wbt_checkin_done_${userId}_${date}`;

const todayDate = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const DEFAULT_SETTINGS: NotificationSettings = { enabled: false, time: '09:00' };

// ─── Settings ────────────────────────────────────────────────────────────────

export function loadSettings(userId: number): NotificationSettings {
  try {
    const raw = localStorage.getItem(settingsKey(userId));
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
      time: typeof parsed.time === 'string' && /^\d{2}:\d{2}$/.test(parsed.time)
        ? parsed.time
        : '09:00',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(
  userId: number,
  settings: NotificationSettings,
): WriteResult {
  try {
    localStorage.setItem(settingsKey(userId), JSON.stringify(settings));
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ─── Daily check-in flag ─────────────────────────────────────────────────────

export function isCheckedInToday(userId: number): boolean {
  try {
    return localStorage.getItem(checkinKey(userId, todayDate())) === 'true';
  } catch {
    return false;
  }
}

export function markCheckedInToday(userId: number): WriteResult {
  try {
    localStorage.setItem(checkinKey(userId, todayDate()), 'true');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export function clearCheckedInFlag(userId: number): WriteResult {
  try {
    localStorage.removeItem(checkinKey(userId, todayDate()));
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ─── Stale-date guard (D-6 / M-3) ────────────────────────────────────────────

/**
 * Scans all localStorage keys belonging to this user and removes any
 * check-in flags whose date is not today (handles device sleep across midnight).
 */
export function clearStaleCheckinFlags(userId: number): void {
  try {
    const today = todayDate();
    const prefix = `wbt_checkin_done_${userId}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !key.endsWith(today)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // silently ignore storage errors during cleanup
  }
}

// ─── Logout cleanup (M-4) ────────────────────────────────────────────────────

/**
 * Removes all notification-related localStorage keys for the given user.
 * Called from AuthContext.logout().
 */
export function clearUserData(userId: number): void {
  try {
    const prefix = `wbt_checkin_done_${userId}_`;
    const keysToRemove: string[] = [settingsKey(userId)];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // silently ignore storage errors during cleanup
  }
}
