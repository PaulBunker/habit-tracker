CREATE TABLE `habit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`completed_at` text,
	`skip_reason` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`deadline_utc` text NOT NULL,
	`timezone_offset` integer NOT NULL,
	`blocked_websites` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
