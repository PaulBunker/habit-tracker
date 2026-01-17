import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  ensureDirectories,
  getBlockedDomains,
  log,
} from './hosts-manager';

// Mock fs
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Hosts Manager', () => {
  const mockBackupDir = path.join(os.homedir(), '.habit-tracker', 'backups');
  const mockLogsDir = path.join(os.homedir(), '.habit-tracker', 'logs');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureDirectories', () => {
    it('should create backup directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);

      ensureDirectories();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(mockBackupDir, { recursive: true });
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(mockLogsDir, { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true);

      ensureDirectories();

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('getBlockedDomains', () => {
    it('should return empty array when no habit tracker section exists', () => {
      mockFs.readFileSync.mockReturnValue(`
127.0.0.1 localhost
::1 localhost
`);

      const domains = getBlockedDomains();

      expect(domains).toEqual([]);
    });

    it('should extract domains from habit tracker section', () => {
      mockFs.readFileSync.mockReturnValue(`
127.0.0.1 localhost

# HABIT-TRACKER-START
127.0.0.1 reddit.com
127.0.0.1 twitter.com
127.0.0.1 youtube.com
# HABIT-TRACKER-END

::1 localhost
`);

      const domains = getBlockedDomains();

      expect(domains).toEqual(['reddit.com', 'twitter.com', 'youtube.com']);
    });

    it('should ignore comments in habit tracker section', () => {
      mockFs.readFileSync.mockReturnValue(`
# HABIT-TRACKER-START
# This is a comment
127.0.0.1 reddit.com
# Another comment
127.0.0.1 twitter.com
# HABIT-TRACKER-END
`);

      const domains = getBlockedDomains();

      expect(domains).toEqual(['reddit.com', 'twitter.com']);
    });

    it('should handle empty habit tracker section', () => {
      mockFs.readFileSync.mockReturnValue(`
# HABIT-TRACKER-START
# HABIT-TRACKER-END
`);

      const domains = getBlockedDomains();

      expect(domains).toEqual([]);
    });
  });

  describe('log', () => {
    it('should write log message to file', () => {
      mockFs.appendFileSync.mockReturnValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      log('Test message');

      expect(mockFs.appendFileSync).toHaveBeenCalled();
      const logCall = mockFs.appendFileSync.mock.calls[0];
      expect(logCall[1]).toContain('Test message');
      expect(logCall[1]).toContain('[INFO]');

      consoleSpy.mockRestore();
    });

    it('should write error log with ERROR level', () => {
      mockFs.appendFileSync.mockReturnValue(undefined);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      log('Error message', 'error');

      expect(mockFs.appendFileSync).toHaveBeenCalled();
      const logCall = mockFs.appendFileSync.mock.calls[0];
      expect(logCall[1]).toContain('Error message');
      expect(logCall[1]).toContain('[ERROR]');

      consoleSpy.mockRestore();
    });

    it('should include timestamp in log', () => {
      mockFs.appendFileSync.mockReturnValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      log('Test');

      const logCall = mockFs.appendFileSync.mock.calls[0];
      expect(logCall[1]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      consoleSpy.mockRestore();
    });
  });
});
