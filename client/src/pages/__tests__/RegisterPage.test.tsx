import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../RegisterPage';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const mockAuthLogin = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockAuthLogin }),
}));

const mockApiRegister = vi.fn();
vi.mock('../../api', () => ({
  api: {
    auth: {
      register: (...args: unknown[]) => mockApiRegister(...args),
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
  return render(<RegisterPage />);
}

function fillForm({
  name = 'Alice Smith',
  email = 'alice@example.com',
  password = 'password123',
}: {
  name?: string;
  email?: string;
  password?: string;
} = {}) {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: password } });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterPage', () => {
  it('R-1: password shorter than 8 chars shows client-side error; API not called', async () => {
    renderPage();
    fillForm({ password: 'short' });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
    expect(mockApiRegister).not.toHaveBeenCalled();
  });

  it('R-2: successful registration navigates to /grocery (not /dashboard)', async () => {
    const fakeToken = 'fake.jwt.token';
    const fakeUser = { id: 1, email: 'alice@example.com', name: 'Alice Smith', role: 'user' as const };
    mockApiRegister.mockResolvedValue({ token: fakeToken, user: fakeUser });

    renderPage();
    fillForm();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/grocery');
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
  });

  it('R-3: server 409 duplicate email error renders error message', async () => {
    mockApiRegister.mockRejectedValue(new Error('Email already registered'));

    renderPage();
    fillForm();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('R-4: submit button is disabled while request is in flight', async () => {
    let resolve: (value: { token: string; user: object }) => void;
    mockApiRegister.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    renderPage();
    fillForm();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    // resolve to clean up
    resolve!({ token: 'tok', user: { id: 1, email: 'alice@example.com', name: 'Alice Smith', role: 'user' } });
  });

  it('R-5: role field defaults to "user" on initial render', () => {
    renderPage();
    const roleSelect = screen.getByLabelText(/i am a/i) as HTMLSelectElement;
    expect(roleSelect.value).toBe('user');
  });

  it('R-6: blank teamName is submitted as undefined (not empty string)', async () => {
    const fakeUser = { id: 1, email: 'alice@example.com', name: 'Alice Smith', role: 'user' as const };
    mockApiRegister.mockResolvedValue({ token: 'tok', user: fakeUser });

    renderPage();
    // Leave teamName blank (default)
    fillForm();
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockApiRegister).toHaveBeenCalled();
    });

    const callArg = mockApiRegister.mock.calls[0][0] as Record<string, unknown>;
    // The spread sets teamName to undefined when left blank — key may be present but value must not be a non-empty string
    expect(callArg.teamName).toBeUndefined();
  });

  it('R-7: link to /login is present in the DOM', () => {
    renderPage();
    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
