ALTER TABLE `users` ADD `telegram_chat_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `telegram_link_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `telegram_link_token_expires_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_telegram_chat_id_unique` ON `users` (`telegram_chat_id`);