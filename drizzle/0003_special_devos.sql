CREATE TABLE IF NOT EXISTS `media_item_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`media_item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`images` text,
	`encrypted_content` text NOT NULL,
	`iv` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_media_item_notes_item` ON `media_item_notes` (`media_item_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`creator` text,
	`url` text,
	`status` text NOT NULL,
	`rating` integer,
	`reactions` text,
	`genres` text,
	`metadata` text,
	`cover_image` text,
	`encrypted_content` text,
	`iv` text,
	`added_at` text NOT NULL,
	`started_at` text,
	`finished_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_media_items_user` ON `media_items` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_media_items_user_updated` ON `media_items` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_media_items_user_type` ON `media_items` (`user_id`,`type`);