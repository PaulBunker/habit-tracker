import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GraphView } from './GraphView';
import type { Habit } from '@habit-tracker/shared';
import {
  emptyGraphData,
  singlePointData,
  twoPointData,
  steadyDeclineData,
  identicalValuesData,
  weightLossJourneyData,
  largeRangeData,
  plateauData,
} from '../test/fixtures/graphData';

// Mock the API client
vi.mock('../api/client', () => ({
  habitsApi: {
    getGraph: vi.fn(),
  },
}));

import { habitsApi } from '../api/client';

const mockHabit: Habit = {
  id: 'habit-1',
  name: 'Weight Tracking',
  description: 'Log daily weight',
  timezoneOffset: 0,
  dataTracking: true,
  dataUnit: 'lbs',
  createdAt: '2024-01-01T00:00:00Z',
  isActive: true,
};

describe('GraphView', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering states', () => {
    it('shows loading state initially', () => {
      // Mock a slow API response
      vi.mocked(habitsApi.getGraph).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows empty state when no data', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: emptyGraphData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('No data yet')).toBeInTheDocument();
      });
    });

    it('renders habit name in header', () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      expect(screen.getByText('Weight Tracking - Graph')).toBeInTheDocument();
    });

    it('renders SVG with data points', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();

        // Should have 7 circle elements for 7 data points
        const circles = svg?.querySelectorAll('circle');
        expect(circles?.length).toBe(steadyDeclineData.length);
      });
    });

    it('renders line path connecting points', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: twoPointData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        const linePath = svg?.querySelector('path[fill="none"]');
        expect(linePath).toBeInTheDocument();
        expect(linePath?.getAttribute('d')).toMatch(/^M .* L /); // Should start with M and have L
      });
    });

    it('renders area fill path', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: twoPointData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        const areaPath = svg?.querySelector('path[opacity="0.1"]');
        expect(areaPath).toBeInTheDocument();
        expect(areaPath?.getAttribute('d')).toMatch(/Z$/); // Should end with Z (closed path)
      });
    });
  });

  describe('Single point handling', () => {
    it('renders single point centered', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: singlePointData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        const circle = svg?.querySelector('circle');
        expect(circle).toBeInTheDocument();

        // Single point should be centered horizontally
        const cx = parseFloat(circle?.getAttribute('cx') || '0');
        const chartWidth = parseFloat(svg?.getAttribute('width') || '0');
        expect(cx).toBe(chartWidth / 2);
      });
    });
  });

  describe('Y-axis positioning', () => {
    it('positions higher values near top and lower values near bottom', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        const circles = svg?.querySelectorAll('circle');

        // First point (188.0) should be higher than last point (185.0)
        // In SVG, lower y = higher on screen
        const firstY = parseFloat(circles?.[0]?.getAttribute('cy') || '0');
        const lastY = parseFloat(circles?.[circles.length - 1]?.getAttribute('cy') || '0');

        expect(firstY).toBeLessThan(lastY);
      });
    });

    it('handles identical values without dividing by zero', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: identicalValuesData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        const circles = svg?.querySelectorAll('circle');

        // All points should render without NaN or errors
        circles?.forEach((circle) => {
          const cy = parseFloat(circle.getAttribute('cy') || 'NaN');
          expect(Number.isNaN(cy)).toBe(false);
          expect(Number.isFinite(cy)).toBe(true);
        });
      });
    });

    it('handles large value ranges with proper scaling', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: largeRangeData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        const circles = svg?.querySelectorAll('circle');

        // Should have 3 points
        expect(circles?.length).toBe(3);

        // All points should be within chart bounds
        circles?.forEach((circle) => {
          const cy = parseFloat(circle.getAttribute('cy') || '0');
          expect(cy).toBeGreaterThanOrEqual(0);
          expect(cy).toBeLessThanOrEqual(200); // chartHeight
        });
      });
    });

    it('handles plateau data with minimal variation', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: plateauData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const svg = document.querySelector('svg');
        const circles = svg?.querySelectorAll('circle');

        // Should render all 7 points
        expect(circles?.length).toBe(7);

        // All Y positions should be valid numbers
        circles?.forEach((circle) => {
          const cy = parseFloat(circle.getAttribute('cy') || 'NaN');
          expect(Number.isFinite(cy)).toBe(true);
        });
      });
    });
  });

  describe('Stats calculations', () => {
    it('displays latest value correctly', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Latest')).toBeInTheDocument();
        expect(screen.getByText('185 lbs')).toBeInTheDocument();
      });
    });

    it('displays average value correctly', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Average')).toBeInTheDocument();
        // Average of 188.0, 187.5, 187.0, 186.5, 186.0, 185.5, 185.0 = 186.5
        expect(screen.getByText('186.5 lbs')).toBeInTheDocument();
      });
    });

    it('displays data points count correctly', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: weightLossJourneyData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Data Points')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
      });
    });

    it('does not show stats when no data', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: emptyGraphData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('No data yet')).toBeInTheDocument();
      });

      expect(screen.queryByText('Latest')).not.toBeInTheDocument();
      expect(screen.queryByText('Average')).not.toBeInTheDocument();
      expect(screen.queryByText('Data Points')).not.toBeInTheDocument();
    });
  });

  describe('Date range selection', () => {
    it('renders all date range buttons', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: '7 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '30 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '90 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();
    });

    it('defaults to 30 days selected', () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      const thirtyDaysBtn = screen.getByRole('button', { name: '30 Days' });
      expect(thirtyDaysBtn).toHaveClass('active');
    });

    it('calls API with correct start date when selecting 7 days', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      const user = userEvent.setup();
      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      // Wait for initial load
      await waitFor(() => {
        expect(habitsApi.getGraph).toHaveBeenCalled();
      });

      // Click 7 Days button
      await user.click(screen.getByRole('button', { name: '7 Days' }));

      await waitFor(() => {
        // Should be called twice - once initially, once after clicking
        expect(habitsApi.getGraph).toHaveBeenCalledTimes(2);
        const lastCall = vi.mocked(habitsApi.getGraph).mock.calls[1];
        expect(lastCall[0]).toBe('habit-1');
        expect(lastCall[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date format
      });
    });

    it('calls API without start date for All Time', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: weightLossJourneyData },
      });

      const user = userEvent.setup();
      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(habitsApi.getGraph).toHaveBeenCalled();
      });

      await user.click(screen.getByRole('button', { name: 'All Time' }));

      await waitFor(() => {
        const lastCall = vi.mocked(habitsApi.getGraph).mock.calls[1];
        expect(lastCall[0]).toBe('habit-1');
        expect(lastCall[1]).toBeUndefined();
      });
    });

    it('updates active class when range changes', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      const user = userEvent.setup();
      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: '7 Days' }));

      await waitFor(() => {
        const sevenDaysBtn = screen.getByRole('button', { name: '7 Days' });
        const thirtyDaysBtn = screen.getByRole('button', { name: '30 Days' });
        expect(sevenDaysBtn).toHaveClass('active');
        expect(thirtyDaysBtn).not.toHaveClass('active');
      });
    });
  });

  describe('Modal behavior', () => {
    it('calls onClose when close button clicked', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      const user = userEvent.setup();
      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: '×' }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking overlay', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      const user = userEvent.setup();
      const { container } = render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      const overlay = container.querySelector('.modal-overlay');
      if (overlay) {
        await user.click(overlay);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking modal content', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      const user = userEvent.setup();
      const { container } = render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      // Wait for content to load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const modal = container.querySelector('.modal.graph-modal');
      if (modal) {
        await user.click(modal);
      }

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Y-axis labels', () => {
    it('displays min, mid, and max values with unit', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: steadyDeclineData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const yAxis = document.querySelector('.graph-y-axis');
        expect(yAxis).toBeInTheDocument();

        // Should have three labels
        const labels = yAxis?.querySelectorAll('span');
        expect(labels?.length).toBe(3);
      });
    });
  });

  describe('Tooltip content', () => {
    it('renders data point tooltips with date and value', async () => {
      vi.mocked(habitsApi.getGraph).mockResolvedValue({
        success: true,
        data: { unit: 'lbs', points: singlePointData },
      });

      render(<GraphView habit={mockHabit} onClose={mockOnClose} />);

      await waitFor(() => {
        const circle = document.querySelector('circle');
        const title = circle?.querySelector('title');
        expect(title?.textContent).toContain('185');
        expect(title?.textContent).toContain('lbs');
      });
    });
  });
});
