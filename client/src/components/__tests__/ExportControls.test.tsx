import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportControls from '../ExportControls';

// ─── Mock api ────────────────────────────────────────────────────────────────

const mockExportCsv = vi.fn();

vi.mock('../../api', () => ({
  api: {
    logs: {
      exportCsv: (...args: unknown[]) => mockExportCsv(...args),
    },
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup() {
  const user = userEvent.setup();
  render(<ExportControls />);
  return { user };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExportControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Export CSV button', () => {
    setup();
    expect(screen.getByRole('button', { name: /export wellbeing logs as csv/i })).toBeInTheDocument();
  });

  it('should render the date range selector with the correct options', () => {
    setup();
    const select = screen.getByLabelText(/date range/i);
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /last 7 days/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /last 30 days/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /last 90 days/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /custom range/i })).toBeInTheDocument();
  });

  it('should not show custom date inputs when a preset is selected', () => {
    setup();
    expect(screen.queryByLabelText(/from/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/to/i)).not.toBeInTheDocument();
  });

  it('should show custom date inputs when "Custom range" is selected', async () => {
    const { user } = setup();
    await user.selectOptions(screen.getByLabelText(/date range/i), 'custom');
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
  });

  it('should call api.logs.exportCsv with days param for a preset selection', async () => {
    mockExportCsv.mockResolvedValue(undefined);
    const { user } = setup();
    await user.selectOptions(screen.getByLabelText(/date range/i), '7');
    await user.click(screen.getByRole('button', { name: /export wellbeing logs as csv/i }));
    await waitFor(() => expect(mockExportCsv).toHaveBeenCalledWith({ days: 7 }));
  });

  it('should call api.logs.exportCsv with start/end for a custom range', async () => {
    mockExportCsv.mockResolvedValue(undefined);
    const { user } = setup();
    await user.selectOptions(screen.getByLabelText(/date range/i), 'custom');
    await user.type(screen.getByLabelText(/from/i), '2026-01-01');
    await user.type(screen.getByLabelText(/to/i), '2026-01-31');
    await user.click(screen.getByRole('button', { name: /export wellbeing logs as csv/i }));
    await waitFor(() =>
      expect(mockExportCsv).toHaveBeenCalledWith({ start: '2026-01-01', end: '2026-01-31' })
    );
  });

  it('should disable the button and show loading text while exporting', async () => {
    let resolve!: () => void;
    mockExportCsv.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /export wellbeing logs as csv/i }));
    expect(screen.getByRole('button', { name: /export wellbeing logs as csv/i })).toBeDisabled();
    expect(screen.getByText(/exporting/i)).toBeInTheDocument();
    resolve();
  });

  it('should re-enable the button after a successful export', async () => {
    mockExportCsv.mockResolvedValue(undefined);
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /export wellbeing logs as csv/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /export wellbeing logs as csv/i })).not.toBeDisabled()
    );
  });

  it('should show an inline error message when exportCsv rejects', async () => {
    mockExportCsv.mockRejectedValue(new Error('Export failed'));
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /export wellbeing logs as csv/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Export failed'));
  });

  it('should re-enable the button after an export error (finally block)', async () => {
    mockExportCsv.mockRejectedValue(new Error('Network error'));
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /export wellbeing logs as csv/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /export wellbeing logs as csv/i })).not.toBeDisabled()
    );
  });

  it('should clear the error message on a subsequent successful export', async () => {
    mockExportCsv.mockRejectedValueOnce(new Error('First failure'));
    mockExportCsv.mockResolvedValueOnce(undefined);
    const { user } = setup();
    const button = screen.getByRole('button', { name: /export wellbeing logs as csv/i });

    await user.click(button);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    await user.click(button);
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('should show an error and not call exportCsv when custom preset is selected with empty dates — F-2', async () => {
    const { user } = setup();
    await user.selectOptions(screen.getByLabelText(/date range/i), 'custom');
    // leave date inputs empty
    await user.click(screen.getByRole('button', { name: /export wellbeing logs as csv/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/please select both a start and end date/i);
    expect(mockExportCsv).not.toHaveBeenCalled();
  });
});
