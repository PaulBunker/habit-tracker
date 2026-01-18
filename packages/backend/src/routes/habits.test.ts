import request from 'supertest';
import app from '../server';
import { db } from '../db';
import { habits, habitLogs } from '../db/schema';

describe('Habits API (V2)', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.delete(habitLogs);
    await db.delete(habits);
  });

  describe('POST /api/habits', () => {
    it('should create a habit with just name (no deadline required)', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Read a book',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Read a book');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.deadlineUtc).toBeFalsy(); // null when not set
      expect(response.body.data.deadlineLocal).toBeUndefined();
      // V2: No blockedWebsites field on habits
      expect(response.body.data.blockedWebsites).toBeUndefined();
    });

    it('should create a habit with optional deadline', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Morning Exercise',
          description: 'Do at least 30 minutes of exercise',
          deadlineLocal: '09:00',
          timezoneOffset: -300,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Morning Exercise');
      expect(response.body.data.description).toBe('Do at least 30 minutes of exercise');
      expect(response.body.data.deadlineLocal).toBe('09:00');
      expect(response.body.data.timezoneOffset).toBe(-300);
      // V2: No blockedWebsites field on habits
      expect(response.body.data.blockedWebsites).toBeUndefined();
    });

    it('should create a habit with data tracking', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Track Weight',
          dataTracking: true,
          dataUnit: 'lbs',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.dataTracking).toBe(true);
      expect(response.body.data.dataUnit).toBe('lbs');
    });

    it('should create a habit with active days', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Workout',
          activeDays: [1, 2, 3, 4, 5], // Weekdays only
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.activeDays).toEqual([1, 2, 3, 4, 5]);
    });

    it('should reject habit without name', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          description: 'Some description',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid deadline format', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Test Habit',
          deadlineLocal: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/habits', () => {
    it('should return empty array when no habits exist', async () => {
      const response = await request(app).get('/api/habits');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return all active habits', async () => {
      // Create two habits
      await request(app).post('/api/habits').send({ name: 'Habit 1' });
      await request(app).post('/api/habits').send({ name: 'Habit 2', deadlineLocal: '14:00' });

      const response = await request(app).get('/api/habits');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // V2: Response should not include blockedWebsites
      response.body.data.forEach((habit: Record<string, unknown>) => {
        expect(habit.blockedWebsites).toBeUndefined();
      });
    });
  });

  describe('GET /api/habits/:id', () => {
    it('should return habit by id', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
        description: 'Test description',
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).get(`/api/habits/${habitId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(habitId);
      expect(response.body.data.name).toBe('Test Habit');
      expect(response.body.data.blockedWebsites).toBeUndefined();
    });

    it('should return 404 for non-existent habit', async () => {
      const response = await request(app).get('/api/habits/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/habits/:id', () => {
    it('should update habit name', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Original Name',
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).put(`/api/habits/${habitId}`).send({
        name: 'Updated Name',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should add deadline to existing habit', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).put(`/api/habits/${habitId}`).send({
        deadlineLocal: '10:00',
        timezoneOffset: 0,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.deadlineLocal).toBe('10:00');
    });

    it('should remove deadline from habit', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
        deadlineLocal: '10:00',
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).put(`/api/habits/${habitId}`).send({
        deadlineLocal: null,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.deadlineLocal).toBeUndefined();
    });

    it('should return 404 for non-existent habit', async () => {
      const response = await request(app).put('/api/habits/non-existent-id').send({
        name: 'Updated',
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('should delete habit', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'To Delete',
      });

      const habitId = createResponse.body.data.id;

      const deleteResponse = await request(app).delete(`/api/habits/${habitId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify it's gone
      const getResponse = await request(app).get(`/api/habits/${habitId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent habit', async () => {
      const response = await request(app).delete('/api/habits/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/habits/:id/complete', () => {
    it('should mark habit as complete', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).post(`/api/habits/${habitId}/complete`).send({
        notes: 'Great session!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.notes).toBe('Great session!');
      expect(response.body.data.completedAt).toBeDefined();
    });

    it('should complete data-tracking habit with value', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Track Weight',
        dataTracking: true,
        dataUnit: 'lbs',
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).post(`/api/habits/${habitId}/complete`).send({
        dataValue: 175.5,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.dataValue).toBe(175.5);
    });

    it('should require dataValue for data-tracking habits', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Track Weight',
        dataTracking: true,
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).post(`/api/habits/${habitId}/complete`).send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent habit', async () => {
      const response = await request(app).post('/api/habits/non-existent-id/complete').send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/habits/:id/skip', () => {
    it('should skip habit with reason', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).post(`/api/habits/${habitId}/skip`).send({
        skipReason: 'Feeling unwell',
        notes: 'Will resume tomorrow',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('skipped');
      expect(response.body.data.skipReason).toBe('Feeling unwell');
      expect(response.body.data.notes).toBe('Will resume tomorrow');
    });

    it('should reject skip without reason', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).post(`/api/habits/${habitId}/skip`).send({
        notes: 'Some notes',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent habit', async () => {
      const response = await request(app).post('/api/habits/non-existent-id/skip').send({
        skipReason: 'Test',
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/habits/:id/logs', () => {
    it('should return empty array when no logs exist', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).get(`/api/habits/${habitId}/logs`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return habit logs', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      // Complete the habit
      await request(app).post(`/api/habits/${habitId}/complete`).send({});

      const response = await request(app).get(`/api/habits/${habitId}/logs`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('completed');
    });

    it('should return 404 for non-existent habit', async () => {
      const response = await request(app).get('/api/habits/non-existent-id/logs');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/habits/:id - additional coverage', () => {
    it('should update activeDays', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Weekday Habit',
        activeDays: [1, 2, 3, 4, 5],
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).put(`/api/habits/${habitId}`).send({
        activeDays: [0, 6], // Weekend only
      });

      expect(response.status).toBe(200);
      expect(response.body.data.activeDays).toEqual([0, 6]);
    });

    it('should clear activeDays by setting to null', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Weekday Habit',
        activeDays: [1, 2, 3, 4, 5],
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).put(`/api/habits/${habitId}`).send({
        activeDays: null,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.activeDays).toBeUndefined();
    });
  });

  describe('POST /api/habits/:id/complete - update existing log', () => {
    it('should update existing log when completing same day twice', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      // Complete first time
      await request(app).post(`/api/habits/${habitId}/complete`).send({
        notes: 'First completion',
      });

      // Complete second time same day - should update
      const response = await request(app).post(`/api/habits/${habitId}/complete`).send({
        notes: 'Updated completion',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.notes).toBe('Updated completion');

      // Verify only one log exists
      const logsResponse = await request(app).get(`/api/habits/${habitId}/logs`);
      expect(logsResponse.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/habits/:id/skip - update existing log', () => {
    it('should update existing log when skipping same day twice', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      // Skip first time
      await request(app).post(`/api/habits/${habitId}/skip`).send({
        skipReason: 'First reason',
      });

      // Skip second time same day - should update
      const response = await request(app).post(`/api/habits/${habitId}/skip`).send({
        skipReason: 'Updated reason',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.skipReason).toBe('Updated reason');

      // Verify only one log exists
      const logsResponse = await request(app).get(`/api/habits/${habitId}/logs`);
      expect(logsResponse.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/habits/:id/calendar', () => {
    it('should return calendar data for habit', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      // Complete the habit
      await request(app).post(`/api/habits/${habitId}/complete`).send({});

      const response = await request(app).get(`/api/habits/${habitId}/calendar`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('completed');
    });

    it('should return 404 for non-existent habit', async () => {
      const response = await request(app).get('/api/habits/non-existent-id/calendar');

      expect(response.status).toBe(404);
    });

    it('should filter by date range', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
      });

      const habitId = createResponse.body.data.id;

      // Complete the habit
      await request(app).post(`/api/habits/${habitId}/complete`).send({});

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // Should include today's log
      const response = await request(app).get(
        `/api/habits/${habitId}/calendar?start=${today}&end=${tomorrow}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);

      // Should exclude with future start date
      const futureResponse = await request(app).get(
        `/api/habits/${habitId}/calendar?start=${tomorrow}`
      );

      expect(futureResponse.status).toBe(200);
      expect(futureResponse.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/habits/:id/graph', () => {
    it('should return graph data for data-tracking habit', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Track Weight',
        dataTracking: true,
        dataUnit: 'lbs',
      });

      const habitId = createResponse.body.data.id;

      // Complete with data value
      await request(app).post(`/api/habits/${habitId}/complete`).send({
        dataValue: 175.5,
      });

      const response = await request(app).get(`/api/habits/${habitId}/graph`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unit).toBe('lbs');
      expect(response.body.data.points).toHaveLength(1);
      expect(response.body.data.points[0].value).toBe(175.5);
    });

    it('should return 404 for non-existent habit', async () => {
      const response = await request(app).get('/api/habits/non-existent-id/graph');

      expect(response.status).toBe(404);
    });

    it('should return 400 for non-data-tracking habit', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Regular Habit',
        dataTracking: false,
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).get(`/api/habits/${habitId}/graph`);

      expect(response.status).toBe(400);
    });

    it('should filter by date range', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Track Weight',
        dataTracking: true,
        dataUnit: 'lbs',
      });

      const habitId = createResponse.body.data.id;

      await request(app).post(`/api/habits/${habitId}/complete`).send({
        dataValue: 175.5,
      });

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // Should include today's data
      const response = await request(app).get(
        `/api/habits/${habitId}/graph?start=${today}&end=${tomorrow}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.points).toHaveLength(1);

      // Should exclude with future start date
      const futureResponse = await request(app).get(
        `/api/habits/${habitId}/graph?start=${tomorrow}`
      );

      expect(futureResponse.status).toBe(200);
      expect(futureResponse.body.data.points).toHaveLength(0);
    });
  });
});
