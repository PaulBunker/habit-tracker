CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`start_time_utc` text,
	`deadline_utc` text,
	`timezone_offset` integer DEFAULT 0 NOT NULL,
	`data_tracking` integer DEFAULT false NOT NULL,
	`data_unit` text,
	`active_days` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`completed_at` text,
	`data_value` real,
	`skip_reason` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO settings (key, value) VALUES ('blockedWebsites', '[]');
