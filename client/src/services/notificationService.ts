// ─── notificationService.ts ───────────────────────────────────────────────────
// Plain TypeScript module — zero React dependencies.
// Wraps the Browser Notifications API with safe guards for unsupported browsers.

const CHECKIN_PATH = '/checkin';

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns true if the browser supports the Notifications API. */
export function isSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Requests browser notification permission.
 * Returns the resulting permission string.
 * If the API is unsupported, resolves to 'denied'.
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isSupported()) return 'denied';
  return Notification.requestPermission();
}

/**
 * Returns the current notification permission state without prompting.
 * Returns 'denied' when the API is unsupported.
 */
export function getPermission(): NotificationPermission {
  if (!isSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Fires a browser notification with the given title and body.
 * Clicking the notification focuses the window and navigates to the check-in page.
 * Does nothing if the API is unsupported or permission is not granted.
 */
export function sendNotification(title: string, body: string): void {
  if (!isSupported() || Notification.permission !== 'granted') return;

  const notification = new Notification(title, { body });

  notification.onclick = () => {
    window.focus();
    window.location.href = CHECKIN_PATH;
  };
}
