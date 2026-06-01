import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { NotificationProvider, useNotificationContext } from '../NotificationContext';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockLoadSettings = vi.fn();
const mockSaveSettings = vi.fn().mockReturnValue({ success: true });
const mockUseNotificationScheduler = vi.fn();

vi.mock('../../services/notificationStorage', () => ({
  loadSettings: (userId: number) => mockLoadSettings(userId),
  saveSettings: (userId: number, s: unknown) => mockSaveSettings(userId, s),
}));

vi.mock('../../hooks/useNotificationScheduler', () => ({
  useNotificationScheduler: (...args: unknown[]) => mockUseNotificationScheduler(...args),
}));

// Auth mock — overridden per test
const mockUseAuth = vi.fn();
vi.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Setup ────────────────────────────────────────────────────────────────────

const USER = { id: 5, email: 'a@b.com', name: 'Alice', role: 'user' as const };
const DEFAULT_SETTINGS = { enabled: false, time: '09:00' };
const CUSTOM_SETTINGS = { enabled: true, time: '08:30' };

function wrapper({ children }: { children: ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

beforeEach(() => {
  mockLoadSettings.mockReturnValue(DEFAULT_SETTINGS);
  mockSaveSettings.mockReturnValue({ success: true });
  mockUseNotificationScheduler.mockReset();
  mockUseAuth.mockReturnValue({ user: USER, isLoading: false });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationContext', () => {
  it('throws when useNotificationContext is called outside provider', () => {
    expect(() => renderHook(() => useNotificationContext())).toThrow(
      'useNotificationContext must be used within <NotificationProvider>',
    );
  });

  it('loads settings from storage after auth is ready', () => {
    mockLoadSettings.mockReturnValue(CUSTOM_SETTINGS);
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    expect(mockLoadSettings).toHaveBeenCalledWith(USER.id);
    expect(result.current.settings).toEqual(CUSTOM_SETTINGS);
  });

  it('uses default settings while auth is loading (H-4)', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    // loadSettings should NOT be called until auth is ready
    expect(mockLoadSettings).not.toHaveBeenCalled();
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('updateSettings persists to storage and updates context state', () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    act(() => {
      result.current.updateSettings({ enabled: true, time: '10:00' });
    });

    expect(mockSaveSettings).toHaveBeenCalledWith(USER.id, { enabled: true, time: '10:00' });
    expect(result.current.settings).toEqual({ enabled: true, time: '10:00' });
  });

  it('updateSettings is a no-op when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    act(() => {
      result.current.updateSettings({ enabled: true, time: '10:00' });
    });

    expect(mockSaveSettings).not.toHaveBeenCalled();
  });

  it('passes correct args to useNotificationScheduler', () => {
    mockLoadSettings.mockReturnValue({ enabled: true, time: '09:00' });
    renderHook(() => useNotificationContext(), { wrapper });
    expect(mockUseNotificationScheduler).toHaveBeenCalledWith(
      USER.id,
      false,
      expect.objectContaining({ enabled: true }),
    );
  });
});
