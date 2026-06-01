import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../LoginPage';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const mockLogin = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const mockApiLogin = vi.fn();
vi.mock('../../api', () => ({
  api: {
    auth: {
      login: (...args: unknown[]) => mockApiLogin(...args),
    },
  },
}));

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
  return render(<LoginPage />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  it('L-1: renders email input with type="email"', () => {
    renderPage();
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('L-2: renders password input with type="password"', () => {
    renderPage();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('L-3: submit button is disabled while request is in flight', async () => {
    let resolve: (value: { token: string; user: object }) => void;
    mockApiLogin.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    renderPage();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    // resolve the promise to clean up
    resolve!({ token: 'tok', user: { id: 1, email: 'test@example.com', name: 'Test', role: 'user' } });
  });

  it('L-4: successful login calls AuthContext login and navigates to /grocery', async () => {
    const fakeToken = 'fake.jwt.token';
    const fakeUser = { id: 1, email: 'test@example.com', name: 'Test User', role: 'user' as const };
    mockApiLogin.mockResolvedValue({ token: fakeToken, user: fakeUser });

    renderPage();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(fakeToken, fakeUser);
      expect(mockNavigate).toHaveBeenCalledWith('/grocery');
    });
  });

  it('L-5: server 401 error renders error message with no navigation', async () => {
    mockApiLogin.mockRejectedValue(new Error('Invalid credentials'));

    renderPage();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('L-6: demo credentials card is visible on the page', () => {
    renderPage();
    expect(screen.getByText('demo@example.com')).toBeInTheDocument();
  });

  it('L-7: link to /register is present in the DOM', () => {
    renderPage();
    const registerLink = screen.getByRole('link', { name: /create one/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});
