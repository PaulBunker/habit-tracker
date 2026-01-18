import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Expand ~ to user's home directory
 */
function expandHome(filePath: string): string {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Resolve path relative to monorepo root (INIT_CWD) for relative paths
 */
function resolveDbPath(rawPath: string): string {
  // Expand home directory
  const expanded = expandHome(rawPath);
  // If it's a relative path and INIT_CWD is set (npm workspace), resolve from monorepo root
  if (!path.isAbsolute(expanded) && process.env.INIT_CWD) {
    return path.resolve(process.env.INIT_CWD, expanded);
  }
  return path.resolve(expanded);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
// Production uses ~/.habit-tracker/data, development uses ./data relative to cwd
const defaultDbPath =
  NODE_ENV === 'production' ? '~/.habit-tracker/data' : path.join(process.cwd(), 'data');
const rawDbDir = process.env.DB_PATH || defaultDbPath;
const dbDir = resolveDbPath(rawDbDir);
const dbPath = path.join(dbDir, 'habit-tracker.db');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`[${NODE_ENV.toUpperCase()}] Database: ${dbPath}`);

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export { schema };
