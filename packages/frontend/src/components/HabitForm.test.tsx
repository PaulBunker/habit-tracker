import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HabitForm } from './HabitForm';
import { habitsApi } from '../api/client';

jest.mock('../api/client', () => ({
  habitsApi: {
    create: jest.fn(),
  },
}));

describe('HabitForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/Habit Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Daily Deadline/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blocked Websites/)).toBeInTheDocument();
  });

  it('should show error when submitting without name', async () => {
    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const submitButton = screen.getByText('Create Habit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Habit name is required')).toBeInTheDocument();
    });
  });

  it('should show error when submitting without deadline', async () => {
    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/Habit Name/);
    fireEvent.change(nameInput, { target: { value: 'Test Habit' } });

    const submitButton = screen.getByText('Create Habit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Deadline is required')).toBeInTheDocument();
    });
  });

  it('should add website to blocked list', () => {
    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const websiteInput = screen.getByLabelText(/Blocked Websites/);
    const addButton = screen.getByText('Add');

    fireEvent.change(websiteInput, { target: { value: 'reddit.com' } });
    fireEvent.click(addButton);

    expect(screen.getByText('reddit.com')).toBeInTheDocument();
  });

  it('should reject invalid domain format', () => {
    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const websiteInput = screen.getByLabelText(/Blocked Websites/);
    const addButton = screen.getByText('Add');

    fireEvent.change(websiteInput, { target: { value: 'not-valid' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Invalid domain format')).toBeInTheDocument();
  });

  it('should remove website from blocked list', () => {
    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const websiteInput = screen.getByLabelText(/Blocked Websites/);
    const addButton = screen.getByText('Add');

    // Add website
    fireEvent.change(websiteInput, { target: { value: 'reddit.com' } });
    fireEvent.click(addButton);

    // Remove website
    const removeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(removeButton);

    expect(screen.queryByText('reddit.com')).not.toBeInTheDocument();
  });

  it('should create habit successfully', async () => {
    (habitsApi.create as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: '1', name: 'Test Habit' },
    });

    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill in form
    fireEvent.change(screen.getByLabelText(/Habit Name/), {
      target: { value: 'Morning Exercise' },
    });
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: 'Do exercise' },
    });
    fireEvent.change(screen.getByLabelText(/Daily Deadline/), {
      target: { value: '09:00' },
    });

    // Submit
    const submitButton = screen.getByText('Create Habit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(habitsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Morning Exercise',
          description: 'Do exercise',
          deadlineLocal: '09:00',
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should call onCancel when cancel button clicked', () => {
    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should prevent duplicate websites', () => {
    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const websiteInput = screen.getByLabelText(/Blocked Websites/);
    const addButton = screen.getByText('Add');

    // Add website first time
    fireEvent.change(websiteInput, { target: { value: 'reddit.com' } });
    fireEvent.click(addButton);

    // Try to add same website again
    fireEvent.change(websiteInput, { target: { value: 'reddit.com' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Website already added')).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    (habitsApi.create as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Server error',
    });

    render(<HabitForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill in form
    fireEvent.change(screen.getByLabelText(/Habit Name/), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByLabelText(/Daily Deadline/), {
      target: { value: '09:00' },
    });

    // Submit
    fireEvent.click(screen.getByText('Create Habit'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});
