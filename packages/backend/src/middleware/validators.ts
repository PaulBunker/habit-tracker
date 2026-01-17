import { z } from 'zod';
import { isValidDomain } from '@habit-tracker/shared';

export const createHabitSchema = z.object({
  name: z.string().min(1, 'Habit name is required').max(100),
  description: z.string().max(500).optional(),
  deadlineLocal: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Invalid time format. Use HH:MM'),
  timezoneOffset: z.number().int().min(-720).max(840),
  blockedWebsites: z
    .array(z.string())
    .refine((domains) => domains.every(isValidDomain), {
      message: 'Invalid domain format',
    }),
});

export const updateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  deadlineLocal: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Invalid time format. Use HH:MM')
    .optional(),
  timezoneOffset: z.number().int().min(-720).max(840).optional(),
  blockedWebsites: z
    .array(z.string())
    .refine((domains) => domains.every(isValidDomain), {
      message: 'Invalid domain format',
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export const completeHabitSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const skipHabitSchema = z.object({
  skipReason: z.string().min(1, 'Skip reason is required').max(500),
  notes: z.string().max(500).optional(),
});
