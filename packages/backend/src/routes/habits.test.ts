import request from 'supertest';
import app from '../server';
import { db } from '../db';
import { habits, habitLogs } from '../db/schema';

describe('Habits API', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.delete(habitLogs);
    await db.delete(habits);
  });

  describe('POST /api/habits', () => {
    it('should create a new habit', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Morning Exercise',
          description: 'Do at least 30 minutes of exercise',
          deadlineLocal: '09:00',
          timezoneOffset: -300,
          blockedWebsites: ['reddit.com', 'twitter.com'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Morning Exercise');
      expect(response.body.data.blockedWebsites).toEqual(['reddit.com', 'twitter.com']);
      expect(response.body.data.id).toBeDefined();
    });

    it('should reject habit without name', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          deadlineLocal: '09:00',
          timezoneOffset: -300,
          blockedWebsites: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject habit without deadline', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Test Habit',
          timezoneOffset: -300,
          blockedWebsites: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid domain format', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Test Habit',
          deadlineLocal: '09:00',
          timezoneOffset: -300,
          blockedWebsites: ['not-valid'],
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

    it('should return all habits', async () => {
      // Create two habits
      await request(app).post('/api/habits').send({
        name: 'Habit 1',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: ['reddit.com'],
      });

      await request(app).post('/api/habits').send({
        name: 'Habit 2',
        deadlineLocal: '14:00',
        timezoneOffset: -300,
        blockedWebsites: ['twitter.com'],
      });

      const response = await request(app).get('/api/habits');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/habits/:id', () => {
    it('should return habit by id', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).get(`/api/habits/${habitId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(habitId);
      expect(response.body.data.name).toBe('Test Habit');
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
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).put(`/api/habits/${habitId}`).send({
        name: 'Updated Name',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
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
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
      });

      const habitId = createResponse.body.data.id;

      const deleteResponse = await request(app).delete(`/api/habits/${habitId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify it's gone
      const getResponse = await request(app).get(`/api/habits/${habitId}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('POST /api/habits/:id/complete', () => {
    it('should mark habit as complete', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
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
  });

  describe('POST /api/habits/:id/skip', () => {
    it('should skip habit with reason', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
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
    });

    it('should reject skip without reason', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
      });

      const habitId = createResponse.body.data.id;

      const response = await request(app).post(`/api/habits/${habitId}/skip`).send({
        notes: 'Some notes',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/habits/:id/logs', () => {
    it('should return habit logs', async () => {
      const createResponse = await request(app).post('/api/habits').send({
        name: 'Test Habit',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: [],
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
  });
});
