import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../SettingsPage';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockUpdateSettings = vi.fn();
const mockRequestPermission = vi.fn<() => Promise<NotificationPermission>>();
const mockIsSupported = vi.fn<() => boolean>().mockReturnValue(true);

vi.mock('../../contexts/NotificationContext', () => ({
  useNotificationContext: () => ({
    settings: { enabled: false, time: '09:00' },
    updateSettings: mockUpdateSettings,
  }),
}));

vi.mock('../../services/notificationService', () => ({
  requestPermission: () => mockRequestPermission(),
  isSupported: () => mockIsSupported(),
}));

// Mock Header to avoid nav-related context requirements
vi.mock('../../components/Header', () => ({
  default: () => <nav data-testid="header" />,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockUpdateSettings.mockReset();
  mockRequestPermission.mockResolvedValue('granted');
  mockIsSupported.mockReturnValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SettingsPage', () => {

  // Scenario 1: Opt-in flow — permission granted
  it('enables toggle and saves when permission is granted', async () => {
    mockRequestPermission.mockResolvedValue('granted');
    renderPage();

    const toggle = screen.getByRole('switch', { name: /toggle daily reminder/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(mockRequestPermission).toHaveBeenCalledOnce();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // Scenario 2: Opt-in denied — toggle reverts, error shown
  it('reverts toggle and shows error when permission is denied', async () => {
    mockRequestPermission.mockResolvedValue('denied');
    renderPage();

    const toggle = screen.getByRole('switch', { name: /toggle daily reminder/i });
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(toggle).toHaveAttribute('aria-checked', 'false');
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toMatch(/denied/i);
  });

  // Scenario 3: Time picker — invalid input is rejected
  it('shows validation error when time value is invalid and save is clicked', () => {
    renderPage();

    const timeInput = screen.getByLabelText(/reminder time/i);
    // fireEvent directly sets e.target.value; an empty string fails /^\d{2}:\d{2}$/
    Object.defineProperty(timeInput, 'value', { writable: true, configurable: true, value: '' });
    fireEvent.change(timeInput, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/valid time/i);
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  // Scenario 4: Unsupported browser — toggle disabled, message shown
  it('renders disabled toggle and unsupported message when Notifications not supported', () => {
    mockIsSupported.mockReturnValue(false);
    renderPage();

    expect(
      screen.getByText(/browser notifications are not supported/i),
    ).toBeInTheDocument();

    const toggle = screen.getByRole('switch', { name: /toggle daily reminder/i });
    expect(toggle).toBeDisabled();

    const saveBtn = screen.getByRole('button', { name: /save preferences/i });
    expect(saveBtn).toBeDisabled();
  });

  // Happy path: valid save calls updateSettings
  it('calls updateSettings with current enabled+time on valid save', async () => {
    mockRequestPermission.mockResolvedValue('granted');
    renderPage();

    // Opt in
    const toggle = screen.getByRole('switch', { name: /toggle daily reminder/i });
    await act(async () => { fireEvent.click(toggle); });

    // Change time
    const timeInput = screen.getByLabelText(/reminder time/i);
    fireEvent.change(timeInput, { target: { value: '10:30' } });

    // Save
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ enabled: true, time: '10:30' });
    await waitFor(() => expect(screen.getByText(/saved/i)).toBeInTheDocument());
  });
});
