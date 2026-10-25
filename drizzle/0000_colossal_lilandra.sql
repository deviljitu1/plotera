CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`type` text NOT NULL,
	`plot` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_project_time` ON `events` (`project`,`created`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`plot` text,
	`message` text NOT NULL,
	`stage` text DEFAULT 'New' NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`published` text,
	`share_token` text,
	`plan` text DEFAULT 'launch' NOT NULL,
	`invoice_status` text DEFAULT 'unbilled' NOT NULL,
	`invoice_amount` integer DEFAULT 4999 NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_share_token_unique` ON `projects` (`share_token`);--> statement-breakpoint
CREATE INDEX `projects_owner` ON `projects` (`owner`);