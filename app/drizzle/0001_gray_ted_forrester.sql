ALTER TABLE `posts` ADD `word_count` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `reading_time` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `summary` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `status` text DEFAULT 'draft' NOT NULL;