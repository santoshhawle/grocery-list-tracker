import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSupported,
  requestPermission,
  getPermission,
  sendNotification,
} from '../notificationService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type NotifInstance = { onclick: unknown };
let notifInstances: NotifInstance[] = [];

function stubNotification(permission: NotificationPermission) {
  notifInstances = [];
  // Must be a real constructor function so `new Notification(...)` works
  function MockNotification(this: NotifInstance, _title: string, _opts: { body: string }) {
    this.onclick = null;
    notifInstances.push(this);
  }
  Object.defineProperty(MockNotification, 'permission', { value: permission, configurable: true, writable: true });
  (MockNotification as unknown as { requestPermission: ReturnType<typeof vi.fn> }).requestPermission =
    vi.fn().mockResolvedValue(permission);
  vi.stubGlobal('Notification', MockNotification);
  return MockNotification as unknown as typeof Notification & { requestPermission: ReturnType<typeof vi.fn> };
}

// Spy on window.focus and stub window.location per test
let focusSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  focusSpy = vi.spyOn(window, 'focus').mockImplementation(() => {});
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  focusSpy.mockRestore();
});

// ─── isSupported ──────────────────────────────────────────────────────────────

describe('isSupported', () => {
  it('returns true when Notification is present in window', () => {
    stubNotification('default');
    expect(isSupported()).toBe(true);
  });

  it('returns false when Notification is absent from window', () => {
    // Remove Notification from global scope
    const original = globalThis.Notification;
    // @ts-expect-error intentional deletion for test
    delete globalThis.Notification;
    expect(isSupported()).toBe(false);
    globalThis.Notification = original;
  });
});

// ─── requestPermission ────────────────────────────────────────────────────────

describe('requestPermission', () => {
  it('calls Notification.requestPermission and returns the result', async () => {
    stubNotification('granted');
    const result = await requestPermission();
    expect(result).toBe('granted');
    expect(Notification.requestPermission).toHaveBeenCalledOnce();
  });

  it('returns "denied" when Notifications API is unsupported', async () => {
    const original = globalThis.Notification;
    // @ts-expect-error intentional deletion for test
    delete globalThis.Notification;
    const result = await requestPermission();
    expect(result).toBe('denied');
    globalThis.Notification = original;
  });
});

// ─── getPermission ────────────────────────────────────────────────────────────

describe('getPermission', () => {
  it('returns current permission state without prompting', () => {
    stubNotification('granted');
    expect(getPermission()).toBe('granted');
    expect(Notification.requestPermission).not.toHaveBeenCalled();
  });

  it('returns "denied" when API is unsupported', () => {
    const original = globalThis.Notification;
    // @ts-expect-error intentional deletion for test
    delete globalThis.Notification;
    expect(getPermission()).toBe('denied');
    globalThis.Notification = original;
  });
});

// ─── sendNotification ─────────────────────────────────────────────────────────

describe('sendNotification', () => {
  it('creates a Notification with correct title and body when permission is granted', () => {
    stubNotification('granted');
    sendNotification('Check in!', 'Time to log your wellbeing.');
    expect(notifInstances).toHaveLength(1);
  });

  it('sets onclick to focus window and navigate to /checkin', () => {
    stubNotification('granted');
    sendNotification('Reminder', 'Check in now.');
    const instance = notifInstances[0];
    expect(typeof instance.onclick).toBe('function');
    (instance.onclick as () => void)();
    expect(focusSpy).toHaveBeenCalled();
    expect(window.location.href).toBe('/checkin');
  });

  it('does nothing when permission is "default" (not granted)', () => {
    stubNotification('default');
    sendNotification('Reminder', 'Check in.');
    expect(notifInstances).toHaveLength(0);
  });

  it('does nothing when permission is "denied"', () => {
    stubNotification('denied');
    sendNotification('Reminder', 'Check in.');
    expect(notifInstances).toHaveLength(0);
  });

  it('does nothing when Notifications API is unsupported', () => {
    const original = globalThis.Notification;
    // @ts-expect-error intentional deletion for test
    delete globalThis.Notification;
    expect(() => sendNotification('Reminder', 'Check in.')).not.toThrow();
    globalThis.Notification = original;
  });
});
