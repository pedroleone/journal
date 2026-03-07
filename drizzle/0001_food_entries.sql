CREATE TABLE `food_entries` (
  `id` text PRIMARY KEY NOT NULL,
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
  `updated_at` text NOT NULL
);

CREATE INDEX `idx_food_date` ON `food_entries` (`year`,`month`,`day`);
CREATE INDEX `idx_food_assigned_logged` ON `food_entries` (`assigned_at`,`logged_at`);
