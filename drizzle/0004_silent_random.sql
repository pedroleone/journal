PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`google_sub` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);--> statement-breakpoint
INSERT INTO `__new_users` (`id`, `google_sub`, `email`, `created_at`, `updated_at`)
SELECT `id`, `google_sub`, `email`, `created_at`, `updated_at`
FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_google_sub` ON `users` (`google_sub`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL CHECK(`source` = 'web'),
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`day` integer NOT NULL,
	`hour` integer,
	`encrypted_content` text NOT NULL,
	`iv` text NOT NULL,
	`images` text,
	`tags` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_entries` (`id`, `user_id`, `source`, `year`, `month`, `day`, `hour`, `encrypted_content`, `iv`, `images`, `tags`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, `source`, `year`, `month`, `day`, `hour`, `encrypted_content`, `iv`, `images`, `tags`, `created_at`, `updated_at`
FROM `entries`
WHERE `source` = 'web';--> statement-breakpoint
DROP TABLE `entries`;--> statement-breakpoint
ALTER TABLE `__new_entries` RENAME TO `entries`;--> statement-breakpoint
CREATE INDEX `idx_entries_user_date` ON `entries` (`user_id`,`year`,`month`,`day`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_entries_unique_user_date` ON `entries` (`user_id`,`year`,`month`,`day`);--> statement-breakpoint
CREATE TABLE `__new_food_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL CHECK(`source` = 'web'),
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
);--> statement-breakpoint
INSERT INTO `__new_food_entries` (`id`, `user_id`, `source`, `year`, `month`, `day`, `hour`, `meal_slot`, `assigned_at`, `logged_at`, `encrypted_content`, `iv`, `images`, `tags`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, `source`, `year`, `month`, `day`, `hour`, `meal_slot`, `assigned_at`, `logged_at`, `encrypted_content`, `iv`, `images`, `tags`, `created_at`, `updated_at`
FROM `food_entries`
WHERE `source` = 'web';--> statement-breakpoint
DROP TABLE `food_entries`;--> statement-breakpoint
ALTER TABLE `__new_food_entries` RENAME TO `food_entries`;--> statement-breakpoint
CREATE INDEX `idx_food_user_date` ON `food_entries` (`user_id`,`year`,`month`,`day`);--> statement-breakpoint
CREATE INDEX `idx_food_assigned_logged` ON `food_entries` (`assigned_at`,`logged_at`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
