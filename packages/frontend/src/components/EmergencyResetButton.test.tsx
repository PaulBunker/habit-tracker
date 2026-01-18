import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmergencyResetButton } from './EmergencyResetButton';

// Mock the API client
vi.mock('../api/client', () => ({
  statusApi: {
    resetHosts: vi.fn(),
  },
}));

import { statusApi } from '../api/client';

describe('EmergencyResetButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders reset button', () => {
    render(<EmergencyResetButton />);

    expect(screen.getByRole('button', { name: /reset blocks/i })).toBeInTheDocument();
  });

  it('shows confirmation dialog on click', async () => {
    render(<EmergencyResetButton />);

    await userEvent.click(screen.getByRole('button', { name: /reset blocks/i }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to reset all blocked websites? This will immediately unblock all sites.'
    );
  });

  it('does not call API if user cancels', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<EmergencyResetButton />);

    await userEvent.click(screen.getByRole('button', { name: /reset blocks/i }));

    expect(statusApi.resetHosts).not.toHaveBeenCalled();
  });

  it('calls API when user confirms', async () => {
    vi.mocked(statusApi.resetHosts).mockResolvedValue({
      success: true,
      data: { message: 'Hosts file reset successfully' },
    });

    render(<EmergencyResetButton />);

    await userEvent.click(screen.getByRole('button', { name: /reset blocks/i }));

    await waitFor(() => {
      expect(statusApi.resetHosts).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state during reset', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(statusApi.resetHosts).mockReturnValue(promise as never);

    render(<EmergencyResetButton />);

    await userEvent.click(screen.getByRole('button', { name: /reset blocks/i }));

    // Button should be disabled during loading
    expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();

    // Resolve the promise
    resolvePromise!({ success: true, data: { message: 'Hosts file reset successfully' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset blocks/i })).not.toBeDisabled();
    });
  });

  it('shows success message after reset', async () => {
    vi.mocked(statusApi.resetHosts).mockResolvedValue({
      success: true,
      data: { message: 'Hosts file reset successfully' },
    });

    render(<EmergencyResetButton />);

    await userEvent.click(screen.getByRole('button', { name: /reset blocks/i }));

    await waitFor(() => {
      expect(screen.getByText(/hosts file reset successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    vi.mocked(statusApi.resetHosts).mockResolvedValue({
      success: false,
      error: 'Daemon not reachable or reset failed',
    });

    render(<EmergencyResetButton />);

    await userEvent.click(screen.getByRole('button', { name: /reset blocks/i }));

    await waitFor(() => {
      expect(screen.getByText(/daemon not reachable or reset failed/i)).toBeInTheDocument();
    });
  });
});
