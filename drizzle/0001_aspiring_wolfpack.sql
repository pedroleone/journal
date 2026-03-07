CREATE TABLE `food_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`day` integer NOT NULL,
	`hour` integer,
	`meal_slot` text,
	`assigned_at` text,
	`logged_at` text NOT NULL,
	`encrypted_content` text NOT NULL,
	`iv` text NOT NULL,
	`images` text,
	`tags` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_food_user_date` ON `food_entries` (`user_id`,`year`,`month`,`day`);--> statement-breakpoint
CREATE INDEX `idx_food_assigned_logged` ON `food_entries` (`assigned_at`,`logged_at`);--> statement-breakpoint
CREATE TABLE `note_subnotes` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`user_id` text NOT NULL,
	`images` text,
	`encrypted_content` text NOT NULL,
	`iv` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_note_subnotes_note` ON `note_subnotes` (`note_id`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`tags` text,
	`images` text,
	`encrypted_content` text NOT NULL,
	`iv` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notes_user` ON `notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notes_user_updated` ON `notes` (`user_id`,`updated_at`);