import { describe, it, expect, vi, beforeEach } from 'vitest';
import { habitsApi, settingsApi, statusApi } from './client';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('habitsApi', () => {
    it('getAll fetches habits', async () => {
      const mockHabits = [{ id: '1', name: 'Test' }];
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockHabits }),
      } as Response);

      const result = await habitsApi.getAll();

      expect(global.fetch).toHaveBeenCalledWith('/api/habits', expect.any(Object));
      expect(result.data).toEqual(mockHabits);
    });

    it('getById fetches single habit', async () => {
      const mockHabit = { id: '1', name: 'Test' };
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockHabit }),
      } as Response);

      const result = await habitsApi.getById('1');

      expect(global.fetch).toHaveBeenCalledWith('/api/habits/1', expect.any(Object));
      expect(result.data).toEqual(mockHabit);
    });

    it('create posts new habit', async () => {
      const newHabit = { name: 'New Habit' };
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { id: '1', ...newHabit } }),
      } as Response);

      await habitsApi.create(newHabit);

      expect(global.fetch).toHaveBeenCalledWith('/api/habits', {
        method: 'POST',
        body: JSON.stringify(newHabit),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('update puts habit changes', async () => {
      const updates = { name: 'Updated' };
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { id: '1', ...updates } }),
      } as Response);

      await habitsApi.update('1', updates);

      expect(global.fetch).toHaveBeenCalledWith('/api/habits/1', {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('delete removes habit', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await habitsApi.delete('1');

      expect(global.fetch).toHaveBeenCalledWith('/api/habits/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('complete posts completion', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await habitsApi.complete('1', { notes: 'Done!' });

      expect(global.fetch).toHaveBeenCalledWith('/api/habits/1/complete', {
        method: 'POST',
        body: JSON.stringify({ notes: 'Done!' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('skip posts skip request', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await habitsApi.skip('1', { skipReason: 'Sick' });

      expect(global.fetch).toHaveBeenCalledWith('/api/habits/1/skip', {
        method: 'POST',
        body: JSON.stringify({ skipReason: 'Sick' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('getLogs fetches habit logs', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] }),
      } as Response);

      await habitsApi.getLogs('1');

      expect(global.fetch).toHaveBeenCalledWith('/api/habits/1/logs', expect.any(Object));
    });

    it('getCalendar fetches calendar data with date range', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] }),
      } as Response);

      await habitsApi.getCalendar('1', '2024-01-01', '2024-01-31');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/habits/1/calendar?start=2024-01-01&end=2024-01-31',
        expect.any(Object)
      );
    });

    it('getGraph fetches graph data', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { points: [] } }),
      } as Response);

      await habitsApi.getGraph('1');

      expect(global.fetch).toHaveBeenCalledWith('/api/habits/1/graph', expect.any(Object));
    });
  });

  describe('settingsApi', () => {
    it('get fetches settings', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { blockedWebsites: [] } }),
      } as Response);

      await settingsApi.get();

      expect(global.fetch).toHaveBeenCalledWith('/api/settings', expect.any(Object));
    });

    it('update puts settings', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await settingsApi.update({ blockedWebsites: ['reddit.com'] });

      expect(global.fetch).toHaveBeenCalledWith('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ blockedWebsites: ['reddit.com'] }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('addBlockedWebsite posts new website', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await settingsApi.addBlockedWebsite('twitter.com');

      expect(global.fetch).toHaveBeenCalledWith('/api/settings/blocked-websites', {
        method: 'POST',
        body: JSON.stringify({ website: 'twitter.com' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('removeBlockedWebsite deletes website', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await settingsApi.removeBlockedWebsite('twitter.com');

      expect(global.fetch).toHaveBeenCalledWith('/api/settings/blocked-websites', {
        method: 'DELETE',
        body: JSON.stringify({ website: 'twitter.com' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('statusApi', () => {
    it('getStatus fetches daemon status', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { isRunning: true } }),
      } as Response);

      await statusApi.getStatus();

      expect(global.fetch).toHaveBeenCalledWith('/api/status', expect.any(Object));
    });

    it('triggerSync posts sync request', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await statusApi.triggerSync();

      expect(global.fetch).toHaveBeenCalledWith('/api/daemon/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('resetHosts posts reset request', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        json: () => Promise.resolve({ success: true, message: 'Hosts file reset successfully' }),
      } as Response);

      const result = await statusApi.resetHosts();

      expect(global.fetch).toHaveBeenCalledWith('/api/daemon/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.success).toBe(true);
    });
  });
});
