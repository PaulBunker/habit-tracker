import { db } from './index';
import { habits, habitLogs, settings } from './schema';
import { randomUUID } from 'crypto';
import type { NewHabitLog } from './schema';

/**
 * Generate 45 days of realistic weight loss journey data
 * - Days 1-30: Steady weight loss (200 lbs → ~190 lbs, ~0.33 lbs/day with noise)
 * - Days 31-45: Plateau phase (fluctuates around 189-191 lbs)
 */
function generateWeightData(habitId: string): NewHabitLog[] {
  const logs: NewHabitLog[] = [];
  const startWeight = 200;

  for (let i = 45; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    let weight: number;

    if (i > 15) {
      // Days 1-30: Weight loss phase (i goes from 45 down to 16)
      const daysIntoLoss = 45 - i;
      const baseWeight = startWeight - daysIntoLoss * 0.33;
      weight = baseWeight + (Math.random() - 0.5) * 1.5; // ±0.75 noise
    } else {
      // Days 31-45: Plateau phase (i goes from 15 down to 0)
      weight = 189.5 + (Math.random() - 0.5) * 2; // 188.5-190.5
    }

    logs.push({
      id: randomUUID(),
      habitId,
      date: date.toISOString().split('T')[0],
      status: 'completed',
      completedAt: date.toISOString(),
      dataValue: Math.round(weight * 10) / 10,
    });
  }
  return logs;
}

async function seed() {
  console.log('Seeding database...');

  // Clear existing data
  await db.delete(habitLogs);
  await db.delete(habits);
  await db.delete(settings);

  // Create sample habits (v2 schema)
  const morningExerciseId = randomUUID();
  const studySessionId = randomUUID();
  const weightTrackingId = randomUUID();
  const eveningReadingId = randomUUID();

  await db.insert(habits).values([
    {
      id: morningExerciseId,
      name: 'Morning Exercise',
      description: 'Do at least 30 minutes of exercise',
      deadlineUtc: '13:00', // 9:00 AM EST - blocking starts when overdue
      timezoneOffset: -240, // EST offset in minutes
      dataTracking: false,
      activeDays: JSON.stringify([1, 2, 3, 4, 5]), // Weekdays only
      isActive: true,
    },
    {
      id: studySessionId,
      name: 'Study Session',
      description: 'Focus on learning for 2 hours',
      deadlineUtc: '18:00', // 2:00 PM EST - blocking starts when overdue
      timezoneOffset: -240,
      dataTracking: false,
      isActive: true,
    },
    {
      id: weightTrackingId,
      name: 'Weight Tracking',
      description: 'Log daily weight',
      timezoneOffset: -240,
      dataTracking: true,
      dataUnit: 'lbs',
      isActive: true,
      // No deadline - this is just a checklist item, no blocking
    },
    {
      id: eveningReadingId,
      name: 'Evening Reading',
      description: 'Read for at least 30 minutes',
      deadlineUtc: '01:00', // 9:00 PM EST - blocking starts when overdue
      timezoneOffset: -240,
      dataTracking: false,
      isActive: true,
    },
  ]);

  // Create global settings (v2: blocked websites are now global)
  await db.insert(settings).values([
    {
      key: 'blockedWebsites',
      value: JSON.stringify(['reddit.com', 'twitter.com', 'youtube.com', 'instagram.com', 'facebook.com', 'tiktok.com']),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // Create sample logs
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  // Generate 45 days of weight tracking data
  const weightLogs = generateWeightData(weightTrackingId);

  await db.insert(habitLogs).values([
    {
      id: randomUUID(),
      habitId: morningExerciseId,
      date: yesterday,
      status: 'completed',
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      notes: 'Great workout!',
    },
    {
      id: randomUUID(),
      habitId: studySessionId,
      date: yesterday,
      status: 'completed',
      completedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    ...weightLogs,
    {
      id: randomUUID(),
      habitId: eveningReadingId,
      date: twoDaysAgo,
      status: 'skipped',
      skipReason: 'Was traveling',
    },
  ]);

  console.log('Database seeded successfully!');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
