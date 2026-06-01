import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  loadSettings,
  saveSettings,
} from '../services/notificationStorage';
import { useNotificationScheduler } from '../hooks/useNotificationScheduler';
import type { NotificationSettings } from '../services/notificationStorage';

// ─── Context shape ────────────────────────────────────────────────────────────

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (next: NotificationSettings) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    time: '09:00',
  });

  // Rehydrate settings once auth is ready and user is known (H-4)
  useEffect(() => {
    if (isLoading || user === null) return;
    setSettings(loadSettings(user.id));
  }, [user, isLoading]);

  // Run the scheduler; re-executes whenever settings or auth state changes (H-3)
  useNotificationScheduler(user?.id ?? null, isLoading, settings);

  function updateSettings(next: NotificationSettings) {
    if (user === null) return;
    saveSettings(user.id, next);
    setSettings(next);
  }

  return (
    <NotificationContext.Provider value={{ settings, updateSettings }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotificationContext(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotificationContext must be used within <NotificationProvider>');
  }
  return ctx;
}
