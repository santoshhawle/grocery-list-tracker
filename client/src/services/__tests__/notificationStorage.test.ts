import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadSettings,
  saveSettings,
  isCheckedInToday,
  markCheckedInToday,
  clearCheckedInFlag,
  clearStaleCheckinFlags,
  clearUserData,
} from '../notificationStorage';

// ─── localStorage mock helpers ────────────────────────────────────────────────

const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    _store: () => store,
  };
})();

beforeEach(() => {
  mockStorage.clear();
  vi.stubGlobal('localStorage', mockStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const USER_ID = 42;
const TODAY = new Date().toISOString().slice(0, 10);

// ─── loadSettings ────────────────────────────────────────────────────────────

describe('loadSettings', () => {
  it('returns default settings when no key exists', () => {
    const result = loadSettings(USER_ID);
    expect(result).toEqual({ enabled: false, time: '09:00' });
  });

  it('returns stored settings when key exists', () => {
    mockStorage.setItem(`wbt_notif_settings_${USER_ID}`, JSON.stringify({ enabled: true, time: '08:30' }));
    const result = loadSettings(USER_ID);
    expect(result).toEqual({ enabled: true, time: '08:30' });
  });

  it('returns default settings when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new DOMException('SecurityError'); },
    });
    const result = loadSettings(USER_ID);
    expect(result).toEqual({ enabled: false, time: '09:00' });
  });

  it('returns default time when stored time is invalid format', () => {
    mockStorage.setItem(`wbt_notif_settings_${USER_ID}`, JSON.stringify({ enabled: true, time: 'invalid' }));
    const result = loadSettings(USER_ID);
    expect(result.time).toBe('09:00');
  });

  it('uses per-user key so different users do not share settings', () => {
    mockStorage.setItem(`wbt_notif_settings_1`, JSON.stringify({ enabled: true, time: '07:00' }));
    const result = loadSettings(2);
    expect(result).toEqual({ enabled: false, time: '09:00' });
  });
});

// ─── saveSettings ─────────────────────────────────────────────────────────────

describe('saveSettings', () => {
  it('saves settings and returns success: true', () => {
    const result = saveSettings(USER_ID, { enabled: true, time: '10:00' });
    expect(result).toEqual({ success: true });
    const stored = JSON.parse(mockStorage.getItem(`wbt_notif_settings_${USER_ID}`) ?? '{}');
    expect(stored).toEqual({ enabled: true, time: '10:00' });
  });

  it('returns success: false when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => { throw new DOMException('QuotaExceededError'); },
    });
    const result = saveSettings(USER_ID, { enabled: true, time: '10:00' });
    expect(result).toEqual({ success: false });
  });
});

// ─── isCheckedInToday ─────────────────────────────────────────────────────────

describe('isCheckedInToday', () => {
  it('returns false when no flag exists', () => {
    expect(isCheckedInToday(USER_ID)).toBe(false);
  });

  it('returns true after markCheckedInToday', () => {
    markCheckedInToday(USER_ID);
    expect(isCheckedInToday(USER_ID)).toBe(true);
  });

  it('returns false when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new DOMException('SecurityError'); },
    });
    expect(isCheckedInToday(USER_ID)).toBe(false);
  });
});

// ─── markCheckedInToday ───────────────────────────────────────────────────────

describe('markCheckedInToday', () => {
  it('sets the correct key and returns success: true', () => {
    const result = markCheckedInToday(USER_ID);
    expect(result).toEqual({ success: true });
    expect(mockStorage.getItem(`wbt_checkin_done_${USER_ID}_${TODAY}`)).toBe('true');
  });

  it('returns success: false when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => { throw new DOMException('QuotaExceededError'); },
    });
    const result = markCheckedInToday(USER_ID);
    expect(result).toEqual({ success: false });
  });
});

// ─── clearCheckedInFlag ───────────────────────────────────────────────────────

describe('clearCheckedInFlag', () => {
  it('removes today flag and returns success: true', () => {
    markCheckedInToday(USER_ID);
    const result = clearCheckedInFlag(USER_ID);
    expect(result).toEqual({ success: true });
    expect(isCheckedInToday(USER_ID)).toBe(false);
  });
});

// ─── clearStaleCheckinFlags ───────────────────────────────────────────────────

describe('clearStaleCheckinFlags', () => {
  it('removes flags from prior days but keeps today', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    mockStorage.setItem(`wbt_checkin_done_${USER_ID}_${yesterday}`, 'true');
    mockStorage.setItem(`wbt_checkin_done_${USER_ID}_${TODAY}`, 'true');

    clearStaleCheckinFlags(USER_ID);

    expect(mockStorage.getItem(`wbt_checkin_done_${USER_ID}_${yesterday}`)).toBeNull();
    expect(mockStorage.getItem(`wbt_checkin_done_${USER_ID}_${TODAY}`)).toBe('true');
  });

  it('does not throw when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      get length() { throw new DOMException('SecurityError'); },
    });
    expect(() => clearStaleCheckinFlags(USER_ID)).not.toThrow();
  });
});

// ─── clearUserData ─────────────────────────────────────────────────────────────

describe('clearUserData', () => {
  it('removes settings key and all checkin flags for the user', () => {
    saveSettings(USER_ID, { enabled: true, time: '09:00' });
    markCheckedInToday(USER_ID);

    clearUserData(USER_ID);

    expect(mockStorage.getItem(`wbt_notif_settings_${USER_ID}`)).toBeNull();
    expect(mockStorage.getItem(`wbt_checkin_done_${USER_ID}_${TODAY}`)).toBeNull();
  });

  it('does not remove keys belonging to a different user', () => {
    const OTHER = 99;
    saveSettings(OTHER, { enabled: true, time: '09:00' });
    saveSettings(USER_ID, { enabled: true, time: '09:00' });

    clearUserData(USER_ID);

    expect(mockStorage.getItem(`wbt_notif_settings_${OTHER}`)).not.toBeNull();
  });
});
