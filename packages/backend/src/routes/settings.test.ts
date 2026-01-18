import request from 'supertest';
import app from '../server';
import { db } from '../db';
import { settings } from '../db/schema';

// Mock the daemon-client to avoid IPC calls during tests
jest.mock('@habit-tracker/shared/daemon-client', () => ({
  notifyDaemon: jest.fn().mockResolvedValue(true),
}));

describe('Settings API', () => {
  beforeEach(async () => {
    // Clear settings before each test
    await db.delete(settings);
  });

  describe('GET /api/settings', () => {
    it('should return empty settings when none exist', async () => {
      const response = await request(app).get('/api/settings');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.blockedWebsites).toEqual([]);
      expect(response.body.data.timezone).toBeUndefined();
    });

    it('should return existing settings', async () => {
      // Seed some settings
      await db.insert(settings).values({
        key: 'blockedWebsites',
        value: JSON.stringify(['reddit.com', 'twitter.com']),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app).get('/api/settings');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.blockedWebsites).toEqual(['reddit.com', 'twitter.com']);
    });
  });

  describe('PUT /api/settings', () => {
    it('should update blocked websites', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({
          blockedWebsites: ['youtube.com', 'facebook.com'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.blockedWebsites).toEqual(['youtube.com', 'facebook.com']);
    });

    it('should update timezone', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({
          timezone: 'America/New_York',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.timezone).toBe('America/New_York');
    });

    it('should update existing settings', async () => {
      // First set some settings
      await db.insert(settings).values({
        key: 'blockedWebsites',
        value: JSON.stringify(['old-site.com']),
        updatedAt: new Date().toISOString(),
      });

      // Now update
      const response = await request(app)
        .put('/api/settings')
        .send({
          blockedWebsites: ['new-site.com'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.blockedWebsites).toEqual(['new-site.com']);
    });
  });

  describe('POST /api/settings/blocked-websites', () => {
    it('should add a website to empty list', async () => {
      const response = await request(app)
        .post('/api/settings/blocked-websites')
        .send({ website: 'reddit.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.blockedWebsites).toContain('reddit.com');
    });

    it('should add a website to existing list', async () => {
      // Seed existing websites
      await db.insert(settings).values({
        key: 'blockedWebsites',
        value: JSON.stringify(['twitter.com']),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/settings/blocked-websites')
        .send({ website: 'reddit.com' });

      expect(response.status).toBe(200);
      expect(response.body.data.blockedWebsites).toEqual(['twitter.com', 'reddit.com']);
    });

    it('should not duplicate existing website', async () => {
      await db.insert(settings).values({
        key: 'blockedWebsites',
        value: JSON.stringify(['reddit.com']),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/settings/blocked-websites')
        .send({ website: 'reddit.com' });

      expect(response.status).toBe(200);
      expect(response.body.data.blockedWebsites).toEqual(['reddit.com']);
    });
  });

  describe('DELETE /api/settings/blocked-websites', () => {
    it('should remove a website from list', async () => {
      await db.insert(settings).values({
        key: 'blockedWebsites',
        value: JSON.stringify(['reddit.com', 'twitter.com']),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .delete('/api/settings/blocked-websites')
        .send({ website: 'reddit.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.blockedWebsites).toEqual(['twitter.com']);
    });

    it('should return 404 for non-existent website', async () => {
      await db.insert(settings).values({
        key: 'blockedWebsites',
        value: JSON.stringify(['twitter.com']),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .delete('/api/settings/blocked-websites')
        .send({ website: 'nonexistent.com' });

      expect(response.status).toBe(404);
    });

    it('should return 404 when list is empty', async () => {
      const response = await request(app)
        .delete('/api/settings/blocked-websites')
        .send({ website: 'reddit.com' });

      expect(response.status).toBe(404);
    });
  });
});
