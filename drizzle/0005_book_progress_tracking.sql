CREATE TABLE `media_item_progress_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`media_item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`progress_kind` text NOT NULL,
	`progress_value` integer NOT NULL,
	`max_value` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "media_item_progress_updates_progress_kind_check" CHECK("media_item_progress_updates"."progress_kind" in ('percent', 'page')),
	CONSTRAINT "media_item_progress_updates_progress_value_check" CHECK("media_item_progress_updates"."progress_value" >= 0),
	CONSTRAINT "media_item_progress_updates_max_value_check" CHECK("media_item_progress_updates"."max_value" is null or "media_item_progress_updates"."max_value" > 0),
	CONSTRAINT "media_item_progress_updates_progress_range_check" CHECK("media_item_progress_updates"."max_value" is null or "media_item_progress_updates"."progress_value" <= "media_item_progress_updates"."max_value"),
	CONSTRAINT "media_item_progress_updates_percent_value_check" CHECK("media_item_progress_updates"."progress_kind" != 'percent' or "media_item_progress_updates"."progress_value" <= 100)
);
--> statement-breakpoint
CREATE INDEX `idx_media_item_progress_updates_item` ON `media_item_progress_updates` (`media_item_id`);--> statement-breakpoint
CREATE INDEX `idx_media_item_progress_updates_user_created` ON `media_item_progress_updates` (`user_id`,`created_at`);
