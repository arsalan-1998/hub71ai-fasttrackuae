CREATE TABLE `scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`inputs` text NOT NULL,
	`created_at` integer NOT NULL
);
