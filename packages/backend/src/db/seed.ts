import { db } from './index';
import { habits, habitLogs, settings } from './schema';
import { randomUUID } from 'crypto';

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
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

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
    {
      id: randomUUID(),
      habitId: weightTrackingId,
      date: twoDaysAgo,
      status: 'completed',
      completedAt: new Date(Date.now() - 172800000).toISOString(),
      dataValue: 185.5,
    },
    {
      id: randomUUID(),
      habitId: weightTrackingId,
      date: yesterday,
      status: 'completed',
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      dataValue: 185.0,
    },
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
