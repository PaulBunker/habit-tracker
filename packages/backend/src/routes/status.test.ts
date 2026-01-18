import request from 'supertest';
import app from '../server';

// Mock the daemon-client
jest.mock('@habit-tracker/shared/daemon-client', () => ({
  pingDaemon: jest.fn(),
  notifyDaemon: jest.fn(),
  resetHosts: jest.fn(),
}));

import { pingDaemon, notifyDaemon, resetHosts } from '@habit-tracker/shared/daemon-client';

const mockPingDaemon = pingDaemon as jest.MockedFunction<typeof pingDaemon>;
const mockNotifyDaemon = notifyDaemon as jest.MockedFunction<typeof notifyDaemon>;
const mockResetHosts = resetHosts as jest.MockedFunction<typeof resetHosts>;

describe('Status API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/status', () => {
    it('should return running status when daemon is reachable', async () => {
      mockPingDaemon.mockResolvedValue(true);

      const response = await request(app).get('/api/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isRunning).toBe(true);
      expect(response.body.data.lastCheck).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
    });

    it('should return not running status when daemon is unreachable', async () => {
      mockPingDaemon.mockResolvedValue(false);

      const response = await request(app).get('/api/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isRunning).toBe(false);
    });

    it('should handle daemon ping errors', async () => {
      mockPingDaemon.mockRejectedValue(new Error('Connection refused'));

      const response = await request(app).get('/api/status');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/daemon/sync', () => {
    it('should return success when daemon sync succeeds', async () => {
      mockNotifyDaemon.mockResolvedValue(true);

      const response = await request(app).post('/api/daemon/sync');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Daemon refresh triggered');
    });

    it('should return failure message when daemon is not reachable', async () => {
      mockNotifyDaemon.mockResolvedValue(false);

      const response = await request(app).post('/api/daemon/sync');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Daemon not reachable');
    });

    it('should handle daemon notify errors', async () => {
      mockNotifyDaemon.mockRejectedValue(new Error('Connection refused'));

      const response = await request(app).post('/api/daemon/sync');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/daemon/reset', () => {
    it('should return success when reset succeeds', async () => {
      mockResetHosts.mockResolvedValue(true);

      const response = await request(app).post('/api/daemon/reset');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Hosts file reset successfully');
    });

    it('should return failure when daemon is not reachable', async () => {
      mockResetHosts.mockResolvedValue(false);

      const response = await request(app).post('/api/daemon/reset');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Daemon not reachable or reset failed');
    });

    it('should handle daemon reset errors', async () => {
      mockResetHosts.mockRejectedValue(new Error('Connection refused'));

      const response = await request(app).post('/api/daemon/reset');

      expect(response.status).toBe(500);
    });
  });
});
