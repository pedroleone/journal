ALTER TABLE `entries` RENAME TO `journal_entries`;

DROP INDEX IF EXISTS `idx_date`;
DROP INDEX IF EXISTS `idx_unique_date`;

CREATE INDEX `idx_journal_date` ON `journal_entries` (`year`,`month`,`day`);
CREATE UNIQUE INDEX `idx_journal_unique_date` ON `journal_entries` (`year`,`month`,`day`);
