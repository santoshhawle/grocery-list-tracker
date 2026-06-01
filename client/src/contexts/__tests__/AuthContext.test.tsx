import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// ── Module mocks ────────────────────────────────────────────────────────────

const mockClearUserData = vi.fn();
vi.mock('../../services/notificationStorage', () => ({
  clearUserData: (...args: unknown[]) => mockClearUserData(...args),
}));

const mockClearAuth = vi.fn();
const mockStoreAuth = vi.fn();
vi.mock('../../api', () => ({
  clearAuth: (...args: unknown[]) => mockClearAuth(...args),
  storeAuth: (...args: unknown[]) => mockStoreAuth(...args),
}));

// ── Test harness ─────────────────────────────────────────────────────────────

/** Renders AuthProvider and exposes the context value for inspection. */
function renderAuth() {
  let ctx!: ReturnType<typeof useAuth>;

  function Consumer() {
    ctx = useAuth();
    return null;
  }

  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );

  return () => ctx;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls clearUserData with the logged-in user id on logout', async () => {
    const getCtx = renderAuth();

    // Simulate login so user state is populated
    act(() => {
      getCtx().login('token-abc', { id: 7, email: 'bob@example.com', name: 'Bob', role: 'user' });
    });
    expect(getCtx().user?.id).toBe(7);

    // Logout — clearUserData must be called before clearAuth
    act(() => {
      getCtx().logout();
    });

    expect(mockClearUserData).toHaveBeenCalledOnce();
    expect(mockClearUserData).toHaveBeenCalledWith(7);
    expect(mockClearAuth).toHaveBeenCalledOnce();
    expect(getCtx().user).toBeNull();
  });

  it('does NOT call clearUserData when no user is logged in', () => {
    const getCtx = renderAuth();

    // No login — user is null
    act(() => {
      getCtx().logout();
    });

    expect(mockClearUserData).not.toHaveBeenCalled();
    expect(mockClearAuth).toHaveBeenCalledOnce();
  });

  it('rehydrates user from localStorage on mount', async () => {
    localStorage.setItem('wbt_token', 'tok');
    localStorage.setItem('wbt_user', JSON.stringify({ id: 3, name: 'Carol', role: 'manager' }));

    const getCtx = renderAuth();

    // Wait for isLoading to settle
    await act(async () => {});
    expect(getCtx().user?.id).toBe(3);
    expect(getCtx().isLoading).toBe(false);
  });
});
