PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_media_item_progress_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`media_item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`progress_kind` text NOT NULL,
	`progress_value` integer NOT NULL,
	`max_value` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`media_item_id`) REFERENCES `media_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "media_item_progress_updates_progress_kind_check" CHECK("__new_media_item_progress_updates"."progress_kind" in ('percent', 'page', 'duration_minutes')),
	CONSTRAINT "media_item_progress_updates_progress_value_check" CHECK("__new_media_item_progress_updates"."progress_value" >= 0),
	CONSTRAINT "media_item_progress_updates_max_value_check" CHECK("__new_media_item_progress_updates"."max_value" is null or "__new_media_item_progress_updates"."max_value" > 0),
	CONSTRAINT "media_item_progress_updates_progress_range_check" CHECK("__new_media_item_progress_updates"."max_value" is null or "__new_media_item_progress_updates"."progress_value" <= "__new_media_item_progress_updates"."max_value"),
	CONSTRAINT "media_item_progress_updates_percent_value_check" CHECK("__new_media_item_progress_updates"."progress_kind" != 'percent' or "__new_media_item_progress_updates"."progress_value" <= 100)
);
--> statement-breakpoint
INSERT INTO `__new_media_item_progress_updates`("id", "media_item_id", "user_id", "progress_kind", "progress_value", "max_value", "created_at") SELECT "id", "media_item_id", "user_id", "progress_kind", "progress_value", "max_value", "created_at" FROM `media_item_progress_updates`;--> statement-breakpoint
DROP TABLE `media_item_progress_updates`;--> statement-breakpoint
ALTER TABLE `__new_media_item_progress_updates` RENAME TO `media_item_progress_updates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_media_item_progress_updates_item` ON `media_item_progress_updates` (`media_item_id`);--> statement-breakpoint
CREATE INDEX `idx_media_item_progress_updates_user_created` ON `media_item_progress_updates` (`user_id`,`created_at`);