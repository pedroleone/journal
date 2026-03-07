CREATE TABLE `entries` (
  `id` text PRIMARY KEY NOT NULL,
  `source` text NOT NULL,
  `year` integer NOT NULL,
  `month` integer NOT NULL,
  `day` integer NOT NULL,
  `hour` integer,
  `encrypted_content` text NOT NULL,
  `iv` text NOT NULL,
  `images` text,
  `tags` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE INDEX `idx_date` ON `entries` (`year`,`month`,`day`);
CREATE UNIQUE INDEX `idx_unique_date` ON `entries` (`year`,`month`,`day`);
