import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Production Build', () => {
  const distPath = join(__dirname, '..', 'dist');
  const indexPath = join(distPath, 'index.html');

  beforeAll(() => {
    // Build if dist doesn't exist or is stale
    if (!existsSync(indexPath)) {
      execSync('npm run build', { cwd: join(__dirname, '..'), stdio: 'pipe' });
    }
  }, 60000);

  describe('version meta tags', () => {
    it('should include app-version meta tag with git hash', () => {
      const html = readFileSync(indexPath, 'utf-8');
      const match = html.match(/<meta name="app-version" content="([^"]+)">/);

      expect(match).not.toBeNull();
      expect(match![1]).toMatch(/^([a-f0-9]{7,}|unknown)$/);
    });

    it('should include build-time meta tag with ISO timestamp', () => {
      const html = readFileSync(indexPath, 'utf-8');
      const match = html.match(/<meta name="build-time" content="([^"]+)">/);

      expect(match).not.toBeNull();
      // Validate ISO 8601 format
      expect(() => new Date(match![1])).not.toThrow();
      expect(new Date(match![1]).toISOString()).toBe(match![1]);
    });
  });
});
