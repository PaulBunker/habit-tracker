import {
  createHabitSchema,
  updateHabitSchema,
  completeHabitSchema,
  skipHabitSchema,
} from './validators';

describe('Validators', () => {
  describe('createHabitSchema', () => {
    it('should validate a complete habit', () => {
      const result = createHabitSchema.safeParse({
        name: 'Morning Exercise',
        description: 'Do 30 minutes of exercise',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: ['reddit.com', 'twitter.com'],
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createHabitSchema.safeParse({
        name: '',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject name over 100 characters', () => {
      const result = createHabitSchema.safeParse({
        name: 'a'.repeat(101),
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid time format', () => {
      const result = createHabitSchema.safeParse({
        name: 'Test',
        deadlineLocal: '9:00', // Should be 09:00
        timezoneOffset: -300,
        blockedWebsites: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid timezone offset', () => {
      const result = createHabitSchema.safeParse({
        name: 'Test',
        deadlineLocal: '09:00',
        timezoneOffset: -1000, // Out of range
        blockedWebsites: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid domain in blockedWebsites', () => {
      const result = createHabitSchema.safeParse({
        name: 'Test',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: ['not a domain!'],
      });

      expect(result.success).toBe(false);
    });

    it('should allow description up to 500 characters', () => {
      const result = createHabitSchema.safeParse({
        name: 'Test',
        description: 'a'.repeat(500),
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
      });

      expect(result.success).toBe(true);
    });

    it('should reject description over 500 characters', () => {
      const result = createHabitSchema.safeParse({
        name: 'Test',
        description: 'a'.repeat(501),
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateHabitSchema', () => {
    it('should allow partial updates', () => {
      const result = updateHabitSchema.safeParse({
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = updateHabitSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it('should allow updating isActive', () => {
      const result = updateHabitSchema.safeParse({
        isActive: false,
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid time format', () => {
      const result = updateHabitSchema.safeParse({
        deadlineLocal: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('completeHabitSchema', () => {
    it('should allow empty object', () => {
      const result = completeHabitSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it('should allow notes', () => {
      const result = completeHabitSchema.safeParse({
        notes: 'Great workout today!',
      });

      expect(result.success).toBe(true);
    });

    it('should reject notes over 500 characters', () => {
      const result = completeHabitSchema.safeParse({
        notes: 'a'.repeat(501),
      });

      expect(result.success).toBe(false);
    });
  });

  describe('skipHabitSchema', () => {
    it('should require skipReason', () => {
      const result = skipHabitSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('should reject empty skipReason', () => {
      const result = skipHabitSchema.safeParse({
        skipReason: '',
      });

      expect(result.success).toBe(false);
    });

    it('should allow valid skip with reason', () => {
      const result = skipHabitSchema.safeParse({
        skipReason: 'Feeling unwell',
      });

      expect(result.success).toBe(true);
    });

    it('should allow skip with reason and notes', () => {
      const result = skipHabitSchema.safeParse({
        skipReason: 'Feeling unwell',
        notes: 'Will resume tomorrow',
      });

      expect(result.success).toBe(true);
    });

    it('should reject skipReason over 500 characters', () => {
      const result = skipHabitSchema.safeParse({
        skipReason: 'a'.repeat(501),
      });

      expect(result.success).toBe(false);
    });
  });
});
