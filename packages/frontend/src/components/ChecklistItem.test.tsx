import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChecklistItem } from './ChecklistItem';
import type { Habit, HabitLog } from '@habit-tracker/shared';

// Mock the API client
vi.mock('../api/client', () => ({
  habitsApi: {
    complete: vi.fn(),
  },
}));

import { habitsApi } from '../api/client';

const mockHabit: Habit = {
  id: '1',
  name: 'Test Habit',
  description: undefined,
  deadlineUtc: undefined,
  deadlineLocal: undefined,
  timezoneOffset: 0,
  dataTracking: false,
  dataUnit: undefined,
  activeDays: undefined,
  createdAt: '2024-01-01',
  isActive: true,
};

const mockHabitWithDeadline: Habit = {
  ...mockHabit,
  deadlineLocal: '09:00',
};

const mockDataTrackingHabit: Habit = {
  ...mockHabit,
  dataTracking: true,
  dataUnit: 'minutes',
};

const mockCompletedLog: HabitLog = {
  id: 'log-1',
  habitId: '1',
  date: '2024-01-01',
  status: 'completed',
  completedAt: '2024-01-01T10:00:00Z',
  dataValue: undefined,
  skipReason: undefined,
  notes: undefined,
  createdAt: '2024-01-01',
};

describe('ChecklistItem', () => {
  const mockOnUpdate = vi.fn();
  const mockOnOpenSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders habit name', () => {
    render(
      <ChecklistItem
        habit={mockHabit}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByText('Test Habit')).toBeInTheDocument();
  });

  it('renders deadline when present', () => {
    render(
      <ChecklistItem
        habit={mockHabitWithDeadline}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByText('by 09:00')).toBeInTheDocument();
  });

  it('renders data unit for tracking habits', () => {
    render(
      <ChecklistItem
        habit={mockDataTrackingHabit}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByText('(minutes)')).toBeInTheDocument();
  });

  it('shows unchecked checkbox for pending habit', () => {
    render(
      <ChecklistItem
        habit={mockHabit}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('shows checked checkbox for completed habit', () => {
    render(
      <ChecklistItem
        habit={mockHabit}
        todayLog={mockCompletedLog}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
  });

  it('completes habit when checkbox clicked', async () => {
    vi.mocked(habitsApi.complete).mockResolvedValue({ success: true });

    render(
      <ChecklistItem
        habit={mockHabit}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    await waitFor(() => {
      expect(habitsApi.complete).toHaveBeenCalledWith('1', expect.any(Object));
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('shows data input for data-tracking habit', async () => {
    render(
      <ChecklistItem
        habit={mockDataTrackingHabit}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    // Should show data input overlay
    expect(screen.getByPlaceholderText(/Enter minutes/i)).toBeInTheDocument();
  });

  it('opens settings when cog clicked', async () => {
    render(
      <ChecklistItem
        habit={mockHabit}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    const settingsButton = screen.getByLabelText('Habit settings');
    await userEvent.click(settingsButton);

    expect(mockOnOpenSettings).toHaveBeenCalledWith(mockHabit);
  });

  it('applies completed class when done', () => {
    const { container } = render(
      <ChecklistItem
        habit={mockHabit}
        todayLog={mockCompletedLog}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(container.querySelector('.checklist-item--completed')).toBeInTheDocument();
  });

  it('shows skipped status', () => {
    const skippedLog: HabitLog = {
      ...mockCompletedLog,
      status: 'skipped',
      skipReason: 'Feeling unwell',
    };

    render(
      <ChecklistItem
        habit={mockHabit}
        todayLog={skippedLog}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByText('skipped')).toBeInTheDocument();
  });

  it('shows missed status', () => {
    const missedLog: HabitLog = {
      ...mockCompletedLog,
      status: 'missed',
    };

    render(
      <ChecklistItem
        habit={mockHabit}
        todayLog={missedLog}
        onUpdate={mockOnUpdate}
        onOpenSettings={mockOnOpenSettings}
      />
    );

    expect(screen.getByText('missed')).toBeInTheDocument();
  });
});
