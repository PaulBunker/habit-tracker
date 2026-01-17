import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HabitCard } from './HabitCard';
import { habitsApi } from '../api/client';

// Mock the API client
jest.mock('../api/client', () => ({
  habitsApi: {
    delete: jest.fn(),
  },
}));

describe('HabitCard', () => {
  const mockOnUpdate = jest.fn();
  const mockHabit = {
    id: '1',
    name: 'Morning Exercise',
    description: 'Do at least 30 minutes of exercise',
    deadlineUtc: '14:00',
    deadlineLocal: '09:00',
    timezoneOffset: -300,
    blockedWebsites: ['reddit.com', 'twitter.com'],
    createdAt: '2026-01-17T00:00:00.000Z',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm
    global.confirm = jest.fn(() => true);
  });

  it('should render habit details', () => {
    render(<HabitCard habit={mockHabit} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('Morning Exercise')).toBeInTheDocument();
    expect(screen.getByText('Do at least 30 minutes of exercise')).toBeInTheDocument();
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
  });

  it('should render blocked websites', () => {
    render(<HabitCard habit={mockHabit} onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/reddit.com, twitter.com/)).toBeInTheDocument();
  });

  it('should show "None" when no blocked websites', () => {
    const habitWithoutWebsites = { ...mockHabit, blockedWebsites: [] };
    render(<HabitCard habit={habitWithoutWebsites} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('should open check-in modal when button clicked', () => {
    render(<HabitCard habit={mockHabit} onUpdate={mockOnUpdate} />);

    const checkInButton = screen.getByText('Check In');
    fireEvent.click(checkInButton);

    expect(screen.getByText(/Check In: Morning Exercise/)).toBeInTheDocument();
  });

  it('should delete habit when delete button clicked', async () => {
    (habitsApi.delete as jest.Mock).mockResolvedValue({ success: true });

    render(<HabitCard habit={mockHabit} onUpdate={mockOnUpdate} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(habitsApi.delete).toHaveBeenCalledWith('1');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should show confirmation before deleting', () => {
    render(<HabitCard habit={mockHabit} onUpdate={mockOnUpdate} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete "Morning Exercise"?'
    );
  });

  it('should not delete if user cancels confirmation', () => {
    global.confirm = jest.fn(() => false);

    render(<HabitCard habit={mockHabit} onUpdate={mockOnUpdate} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(habitsApi.delete).not.toHaveBeenCalled();
  });
});
