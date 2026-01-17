import { db } from './index';
import { habits, habitLogs } from './schema';
import { randomUUID } from 'crypto';

async function seed() {
  console.log('Seeding database...');

  // Clear existing data
  await db.delete(habitLogs);
  await db.delete(habits);

  // Create sample habits
  const morningExerciseId = randomUUID();
  const studySessionId = randomUUID();
  const eveningReadingId = randomUUID();

  await db.insert(habits).values([
    {
      id: morningExerciseId,
      name: 'Morning Exercise',
      description: 'Do at least 30 minutes of exercise',
      deadlineUtc: '13:00', // 9:00 AM EST (UTC-4)
      timezoneOffset: -240, // EST offset in minutes
      blockedWebsites: JSON.stringify(['reddit.com', 'twitter.com']),
      isActive: true,
    },
    {
      id: studySessionId,
      name: 'Study Session',
      description: 'Focus on learning for 2 hours',
      deadlineUtc: '18:00', // 2:00 PM EST
      timezoneOffset: -240,
      blockedWebsites: JSON.stringify(['youtube.com', 'instagram.com']),
      isActive: true,
    },
    {
      id: eveningReadingId,
      name: 'Evening Reading',
      description: 'Read for at least 30 minutes',
      deadlineUtc: '01:00', // 9:00 PM EST (previous day in UTC)
      timezoneOffset: -240,
      blockedWebsites: JSON.stringify(['facebook.com', 'tiktok.com']),
      isActive: true,
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
