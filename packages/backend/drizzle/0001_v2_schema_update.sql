ALTER TABLE habits ADD COLUMN start_time_utc TEXT;--> statement-breakpoint
ALTER TABLE habits ADD COLUMN data_tracking INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE habits ADD COLUMN data_unit TEXT;--> statement-breakpoint
ALTER TABLE habits ADD COLUMN active_days TEXT;--> statement-breakpoint
ALTER TABLE habit_logs ADD COLUMN data_value REAL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);--> statement-breakpoint
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('blockedWebsites', '[]', CURRENT_TIMESTAMP);
