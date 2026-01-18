import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuickAddHabit } from './QuickAddHabit';

// Mock the API client
vi.mock('../api/client', () => ({
  habitsApi: {
    create: vi.fn(),
  },
}));

import { habitsApi } from '../api/client';

describe('QuickAddHabit', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input and submit button', () => {
    render(<QuickAddHabit onSuccess={mockOnSuccess} />);

    expect(screen.getByPlaceholderText('Add a new habit...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
  });

  it('disables submit button when input is empty', () => {
    render(<QuickAddHabit onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: '+' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when input has text', async () => {
    render(<QuickAddHabit onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText('Add a new habit...');
    await userEvent.type(input, 'New habit');

    const submitButton = screen.getByRole('button', { name: '+' });
    expect(submitButton).not.toBeDisabled();
  });

  it('submits habit and calls onSuccess', async () => {
    vi.mocked(habitsApi.create).mockResolvedValue({ success: true, data: { id: '1', name: 'New habit', timezoneOffset: 0, dataTracking: false, createdAt: '2024-01-01', isActive: true } });

    render(<QuickAddHabit onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText('Add a new habit...');
    await userEvent.type(input, 'New habit');
    
    const submitButton = screen.getByRole('button', { name: '+' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(habitsApi.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New habit',
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('clears input after successful submission', async () => {
    vi.mocked(habitsApi.create).mockResolvedValue({ success: true, data: { id: '1', name: 'New habit', timezoneOffset: 0, dataTracking: false, createdAt: '2024-01-01', isActive: true } });

    render(<QuickAddHabit onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText('Add a new habit...');
    await userEvent.type(input, 'New habit');
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('displays error on API failure', async () => {
    vi.mocked(habitsApi.create).mockResolvedValue({ success: false, error: 'Failed to create' });

    render(<QuickAddHabit onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText('Add a new habit...');
    await userEvent.type(input, 'New habit');
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create')).toBeInTheDocument();
    });
  });

  it('trims whitespace from habit name', async () => {
    vi.mocked(habitsApi.create).mockResolvedValue({ success: true, data: { id: '1', name: 'New habit', timezoneOffset: 0, dataTracking: false, createdAt: '2024-01-01', isActive: true } });

    render(<QuickAddHabit onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText('Add a new habit...');
    await userEvent.type(input, '  New habit  ');
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    await waitFor(() => {
      expect(habitsApi.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New habit',
      }));
    });
  });

  it('does not submit whitespace-only input', async () => {
    render(<QuickAddHabit onSuccess={mockOnSuccess} />);

    const input = screen.getByPlaceholderText('Add a new habit...');
    await userEvent.type(input, '   ');

    const submitButton = screen.getByRole('button', { name: '+' });
    expect(submitButton).toBeDisabled();
  });
});
