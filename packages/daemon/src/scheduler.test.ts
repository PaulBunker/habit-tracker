// Mock better-sqlite3 before importing scheduler
jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => ({
    prepare: jest.fn(),
    exec: jest.fn(),
  }));
});

// Mock drizzle-orm - use any to avoid complex typing
/* eslint-disable @typescript-eslint/no-explicit-any */
const mockSelect = jest.fn() as jest.Mock<any, any>;
const mockFrom = jest.fn() as jest.Mock<any, any>;
const mockWhere = jest.fn() as jest.Mock<any, any>;
const mockInsert = jest.fn() as jest.Mock<any, any>;
const mockValues = jest.fn() as jest.Mock<any, any>;

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
};

jest.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: jest.fn(() => mockDb),
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-12345'),
}));

// Mock @habit-tracker/shared
const mockGetCurrentTimeUtc = jest.fn() as jest.Mock<string, []>;
const mockGetCurrentDateUtc = jest.fn() as jest.Mock<string, []>;

jest.mock('@habit-tracker/shared', () => ({
  getCurrentTimeUtc: mockGetCurrentTimeUtc,
  getCurrentDateUtc: mockGetCurrentDateUtc,
}));
/* eslint-enable @typescript-eslint/no-explicit-any */

// Import after mocks are set up
import {
  checkHabits,
  getNextDeadlineMs,
  // Internal functions exported for testing
  expandHome,
  resolveDbPath,
  isHabitActiveToday,
  hasDeadline,
  isOverdue,
} from './scheduler';

describe('Scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock chain
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue([]);
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockResolvedValue(undefined);
  });

  describe('expandHome', () => {
    it('should expand ~ to home directory', () => {
      const result = expandHome('~/test/path');
      expect(result).toContain('test/path');
      expect(result).not.toContain('~');
    });

    it('should return path unchanged if no ~', () => {
      const result = expandHome('/absolute/path');
      expect(result).toBe('/absolute/path');
    });

    it('should handle path that is just ~', () => {
      const result = expandHome('~');
      expect(result).not.toBe('~');
      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe('resolveDbPath', () => {
    it('should expand home directory in path', () => {
      const result = resolveDbPath('~/.habit-tracker/data');
      expect(result).toContain('.habit-tracker/data');
      expect(result).not.toContain('~');
    });

    it('should return absolute path unchanged', () => {
      const result = resolveDbPath('/absolute/path/to/db');
      expect(result).toBe('/absolute/path/to/db');
    });
  });

  describe('hasDeadline', () => {
    it('should return true when habit has deadlineUtc', () => {
      const habit = { deadlineUtc: '09:00' } as any;
      expect(hasDeadline(habit)).toBe(true);
    });

    it('should return false when habit has no deadlineUtc', () => {
      const habit = { deadlineUtc: null } as any;
      expect(hasDeadline(habit)).toBe(false);
    });

    it('should return false when deadlineUtc is undefined', () => {
      const habit = {} as any;
      expect(hasDeadline(habit)).toBe(false);
    });

    it('should return false when deadlineUtc is empty string', () => {
      const habit = { deadlineUtc: '' } as any;
      expect(hasDeadline(habit)).toBe(false);
    });
  });

  describe('isOverdue', () => {
    it('should return true when current time is past deadline', () => {
      const habit = { deadlineUtc: '09:00' } as any;
      expect(isOverdue(habit, '09:01')).toBe(true);
    });

    it('should return true when current time equals deadline', () => {
      const habit = { deadlineUtc: '09:00' } as any;
      expect(isOverdue(habit, '09:00')).toBe(true);
    });

    it('should return false when current time is before deadline', () => {
      const habit = { deadlineUtc: '09:00' } as any;
      expect(isOverdue(habit, '08:59')).toBe(false);
    });

    it('should return false when habit has no deadline', () => {
      const habit = { deadlineUtc: null } as any;
      expect(isOverdue(habit, '12:00')).toBe(false);
    });

    it('should handle midnight correctly', () => {
      const habit = { deadlineUtc: '00:00' } as any;
      expect(isOverdue(habit, '00:00')).toBe(true);
      expect(isOverdue(habit, '23:59')).toBe(true);
    });

    it('should handle late night deadlines', () => {
      const habit = { deadlineUtc: '23:59' } as any;
      expect(isOverdue(habit, '23:58')).toBe(false);
      expect(isOverdue(habit, '23:59')).toBe(true);
    });
  });

  describe('isHabitActiveToday', () => {
    beforeEach(() => {
      // Mock Date to control the day of week
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true when activeDays is null (every day)', () => {
      const habit = { activeDays: null } as any;
      expect(isHabitActiveToday(habit)).toBe(true);
    });

    it('should return true when activeDays is undefined', () => {
      const habit = {} as any;
      expect(isHabitActiveToday(habit)).toBe(true);
    });

    it('should return true when today is in activeDays', () => {
      // Set to a known day - Sunday (0)
      jest.setSystemTime(new Date('2026-01-18T12:00:00Z')); // Sunday
      const habit = { activeDays: '[0, 1, 2]' } as any;
      expect(isHabitActiveToday(habit)).toBe(true);
    });

    it('should return false when today is not in activeDays', () => {
      // Set to a known day - Sunday (0)
      jest.setSystemTime(new Date('2026-01-18T12:00:00Z')); // Sunday
      const habit = { activeDays: '[1, 2, 3]' } as any; // Mon, Tue, Wed
      expect(isHabitActiveToday(habit)).toBe(false);
    });

    it('should handle weekday-only habits', () => {
      // Monday
      jest.setSystemTime(new Date('2026-01-19T12:00:00Z'));
      const habit = { activeDays: '[1, 2, 3, 4, 5]' } as any; // Mon-Fri
      expect(isHabitActiveToday(habit)).toBe(true);

      // Saturday
      jest.setSystemTime(new Date('2026-01-24T12:00:00Z'));
      expect(isHabitActiveToday(habit)).toBe(false);
    });

    it('should handle weekend-only habits', () => {
      const habit = { activeDays: '[0, 6]' } as any; // Sun, Sat

      // Saturday
      jest.setSystemTime(new Date('2026-01-24T12:00:00Z'));
      expect(isHabitActiveToday(habit)).toBe(true);

      // Monday
      jest.setSystemTime(new Date('2026-01-19T12:00:00Z'));
      expect(isHabitActiveToday(habit)).toBe(false);
    });
  });

  describe('checkHabits', () => {
    beforeEach(() => {
      mockGetCurrentTimeUtc.mockReturnValue('10:00');
      mockGetCurrentDateUtc.mockReturnValue('2026-01-20');
    });

    it('should return empty arrays when no habits exist', async () => {
      mockWhere.mockResolvedValueOnce([]); // No active habits

      const result = await checkHabits();

      expect(result.domainsToBlock).toEqual([]);
      expect(result.incompleteTimedHabits).toEqual([]);
      expect(result.missedHabits).toEqual([]);
    });

    it('should not block when habit has no deadline', async () => {
      const habitWithoutDeadline = {
        id: 'habit-1',
        name: 'Simple Habit',
        deadlineUtc: null,
        activeDays: null,
        isActive: true,
      };
      mockWhere.mockResolvedValueOnce([habitWithoutDeadline]);

      const result = await checkHabits();

      expect(result.domainsToBlock).toEqual([]);
      expect(result.incompleteTimedHabits).toEqual([]);
    });

    it('should not block when habit is not active today', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-18T12:00:00Z')); // Sunday

      const habitNotActiveToday = {
        id: 'habit-1',
        name: 'Weekday Habit',
        deadlineUtc: '09:00',
        activeDays: '[1, 2, 3, 4, 5]', // Mon-Fri only
        isActive: true,
      };
      mockWhere.mockResolvedValueOnce([habitNotActiveToday]);

      const result = await checkHabits();

      expect(result.domainsToBlock).toEqual([]);
      jest.useRealTimers();
    });

    it('should not block when deadline has not passed', async () => {
      mockGetCurrentTimeUtc.mockReturnValue('08:00'); // Before 09:00 deadline

      const habitBeforeDeadline = {
        id: 'habit-1',
        name: 'Morning Habit',
        deadlineUtc: '09:00',
        activeDays: null,
        isActive: true,
      };
      mockWhere.mockResolvedValueOnce([habitBeforeDeadline]);

      const result = await checkHabits();

      expect(result.domainsToBlock).toEqual([]);
      expect(result.incompleteTimedHabits).toEqual([]);
    });

    it('should block when habit is overdue and incomplete', async () => {
      mockGetCurrentTimeUtc.mockReturnValue('10:00'); // After 09:00 deadline

      const overdueHabit = {
        id: 'habit-1',
        name: 'Morning Exercise',
        deadlineUtc: '09:00',
        activeDays: null,
        isActive: true,
      };

      // First call: get active habits
      mockWhere.mockResolvedValueOnce([overdueHabit]);
      // Second call: check for today's log (none exists)
      mockWhere.mockResolvedValueOnce([]);
      // Third call: get blocked websites
      mockWhere.mockResolvedValueOnce([{ key: 'blockedWebsites', value: '["reddit.com","twitter.com"]' }]);

      const result = await checkHabits();

      expect(result.domainsToBlock).toEqual(['reddit.com', 'twitter.com']);
      expect(result.incompleteTimedHabits).toEqual([{ id: 'habit-1', name: 'Morning Exercise' }]);
      expect(result.missedHabits).toEqual([{ id: 'habit-1', name: 'Morning Exercise' }]);
    });

    it('should not block when overdue habit is completed', async () => {
      mockGetCurrentTimeUtc.mockReturnValue('10:00');

      const overdueHabit = {
        id: 'habit-1',
        name: 'Morning Exercise',
        deadlineUtc: '09:00',
        activeDays: null,
        isActive: true,
      };

      // First call: get active habits
      mockWhere.mockResolvedValueOnce([overdueHabit]);
      // Second call: check for today's log (completed)
      mockWhere.mockResolvedValueOnce([{ habitId: 'habit-1', date: '2026-01-20', status: 'completed' }]);

      const result = await checkHabits();

      expect(result.domainsToBlock).toEqual([]);
      expect(result.incompleteTimedHabits).toEqual([]);
    });

    it('should not block when overdue habit is skipped', async () => {
      mockGetCurrentTimeUtc.mockReturnValue('10:00');

      const overdueHabit = {
        id: 'habit-1',
        name: 'Morning Exercise',
        deadlineUtc: '09:00',
        activeDays: null,
        isActive: true,
      };

      // First call: get active habits
      mockWhere.mockResolvedValueOnce([overdueHabit]);
      // Second call: check for today's log (skipped)
      mockWhere.mockResolvedValueOnce([{ habitId: 'habit-1', date: '2026-01-20', status: 'skipped' }]);

      const result = await checkHabits();

      expect(result.domainsToBlock).toEqual([]);
      expect(result.incompleteTimedHabits).toEqual([]);
    });

    it('should create missed log for overdue habit without log', async () => {
      mockGetCurrentTimeUtc.mockReturnValue('10:00');

      const overdueHabit = {
        id: 'habit-1',
        name: 'Morning Exercise',
        deadlineUtc: '09:00',
        activeDays: null,
        isActive: true,
      };

      mockWhere.mockResolvedValueOnce([overdueHabit]);
      mockWhere.mockResolvedValueOnce([]); // No existing log
      mockWhere.mockResolvedValueOnce([{ key: 'blockedWebsites', value: '[]' }]);

      await checkHabits();

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          habitId: 'habit-1',
          status: 'missed',
        })
      );
    });

    it('should not create missed log if log already exists with missed status', async () => {
      mockGetCurrentTimeUtc.mockReturnValue('10:00');

      const overdueHabit = {
        id: 'habit-1',
        name: 'Morning Exercise',
        deadlineUtc: '09:00',
        activeDays: null,
        isActive: true,
      };

      mockWhere.mockResolvedValueOnce([overdueHabit]);
      // Log exists with missed status
      mockWhere.mockResolvedValueOnce([{ habitId: 'habit-1', date: '2026-01-20', status: 'missed' }]);
      mockWhere.mockResolvedValueOnce([{ key: 'blockedWebsites', value: '[]' }]);

      await checkHabits();

      // Should not insert a new log since one already exists
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should handle multiple overdue habits', async () => {
      mockGetCurrentTimeUtc.mockReturnValue('12:00');

      const overdueHabits = [
        { id: 'habit-1', name: 'Exercise', deadlineUtc: '09:00', activeDays: null, isActive: true },
        { id: 'habit-2', name: 'Read', deadlineUtc: '10:00', activeDays: null, isActive: true },
        { id: 'habit-3', name: 'Meditate', deadlineUtc: '11:00', activeDays: null, isActive: true },
      ];

      mockWhere.mockResolvedValueOnce(overdueHabits);
      mockWhere.mockResolvedValueOnce([]); // habit-1 no log
      mockWhere.mockResolvedValueOnce([]); // habit-2 no log
      mockWhere.mockResolvedValueOnce([]); // habit-3 no log
      mockWhere.mockResolvedValueOnce([{ key: 'blockedWebsites', value: '["example.com"]' }]);

      const result = await checkHabits();

      expect(result.incompleteTimedHabits).toHaveLength(3);
      expect(result.missedHabits).toHaveLength(3);
      expect(result.domainsToBlock).toEqual(['example.com']);
    });

    it('should return empty domains when no blocked websites configured', async () => {
      mockGetCurrentTimeUtc.mockReturnValue('10:00');

      const overdueHabit = {
        id: 'habit-1',
        name: 'Morning Exercise',
        deadlineUtc: '09:00',
        activeDays: null,
        isActive: true,
      };

      mockWhere.mockResolvedValueOnce([overdueHabit]);
      mockWhere.mockResolvedValueOnce([]); // No log
      mockWhere.mockResolvedValueOnce([]); // No blocked websites setting

      const result = await checkHabits();

      expect(result.domainsToBlock).toEqual([]);
      expect(result.incompleteTimedHabits).toHaveLength(1);
    });
  });

  describe('getNextDeadlineMs', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return null when no habits exist', async () => {
      mockWhere.mockResolvedValueOnce([]);

      const result = await getNextDeadlineMs();

      expect(result).toBeNull();
    });

    it('should return null when no habits have deadlines', async () => {
      const habitsWithoutDeadlines = [
        { id: 'habit-1', name: 'Simple Habit', deadlineUtc: null, activeDays: null, isActive: true },
      ];
      mockWhere.mockResolvedValueOnce(habitsWithoutDeadlines);

      const result = await getNextDeadlineMs();

      expect(result).toBeNull();
    });

    it('should return null when all deadlines have passed', async () => {
      // Set current time to 14:00
      jest.setSystemTime(new Date('2026-01-20T14:00:00Z'));
      mockGetCurrentTimeUtc.mockReturnValue('14:00');

      const habitsWithPastDeadlines = [
        { id: 'habit-1', name: 'Morning Habit', deadlineUtc: '09:00', activeDays: null, isActive: true },
        { id: 'habit-2', name: 'Noon Habit', deadlineUtc: '12:00', activeDays: null, isActive: true },
      ];
      mockWhere.mockResolvedValueOnce(habitsWithPastDeadlines);

      const result = await getNextDeadlineMs();

      expect(result).toBeNull();
    });

    it('should return ms until the soonest upcoming deadline', async () => {
      // Set current time to 08:00
      jest.setSystemTime(new Date('2026-01-20T08:00:00Z'));
      mockGetCurrentTimeUtc.mockReturnValue('08:00');

      const habitsWithUpcomingDeadlines = [
        { id: 'habit-1', name: 'Morning Habit', deadlineUtc: '09:00', activeDays: null, isActive: true },
        { id: 'habit-2', name: 'Noon Habit', deadlineUtc: '12:00', activeDays: null, isActive: true },
      ];
      mockWhere.mockResolvedValueOnce(habitsWithUpcomingDeadlines);

      const result = await getNextDeadlineMs();

      // 09:00 - 08:00 = 1 hour = 3600000 ms
      expect(result).toBe(3600000);
    });

    it('should skip habits not active today', async () => {
      // Set to Sunday
      jest.setSystemTime(new Date('2026-01-18T08:00:00Z'));
      mockGetCurrentTimeUtc.mockReturnValue('08:00');

      const habits = [
        { id: 'habit-1', name: 'Weekday Habit', deadlineUtc: '09:00', activeDays: '[1,2,3,4,5]', isActive: true },
        { id: 'habit-2', name: 'Weekend Habit', deadlineUtc: '10:00', activeDays: '[0,6]', isActive: true },
      ];
      mockWhere.mockResolvedValueOnce(habits);

      const result = await getNextDeadlineMs();

      // Should return time until 10:00 (weekend habit), not 09:00 (weekday habit)
      // 10:00 - 08:00 = 2 hours = 7200000 ms
      expect(result).toBe(7200000);
    });

    it('should handle habits with mixed past and future deadlines', async () => {
      jest.setSystemTime(new Date('2026-01-20T10:30:00Z'));
      mockGetCurrentTimeUtc.mockReturnValue('10:30');

      const habits = [
        { id: 'habit-1', name: 'Past Habit', deadlineUtc: '09:00', activeDays: null, isActive: true },
        { id: 'habit-2', name: 'Future Habit', deadlineUtc: '14:00', activeDays: null, isActive: true },
      ];
      mockWhere.mockResolvedValueOnce(habits);

      const result = await getNextDeadlineMs();

      // 14:00 - 10:30 = 3.5 hours = 12600000 ms
      expect(result).toBe(12600000);
    });
  });
});
