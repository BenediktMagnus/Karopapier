BEGIN TRANSACTION;

-- The classical user table with their credentials:
CREATE TABLE `user` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`name`	TEXT NOT NULL UNIQUE,
	`passwordHash`	TEXT NOT NULL,
	`isAdmin`	INTEGER NOT NULL DEFAULT 0
);

-- Sessions are used to identify users after their login:
CREATE TABLE `session` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`userId`	INTEGER NOT NULL,
	`token`	TEXT NOT NULL UNIQUE,
	`lastAccess`	INTEGER NOT NULL,
	FOREIGN KEY(`userId`) REFERENCES `user`(`id`)
);

-- Maps and their meta data:
CREATE TABLE `map` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`publicIdentifier`	TEXT NOT NULL UNIQUE,
	`name`	TEXT NOT NULL,
	`isActive`	INTEGER NOT NULL DEFAULT 1
);

-- The collection of anonymous entries:
CREATE TABLE `mapEntryAnonymous` (
	`mapId`	INTEGER NOT NULL,
	`ip`	TEXT NOT NULL,
	`x`	INTEGER NOT NULL,
	`y`	INTEGER NOT NULL,
	`contentId`	INTEGER NOT NULL,
	FOREIGN KEY(`mapId`) REFERENCES `map`(`id`),
	FOREIGN KEY(`contentId`) REFERENCES `content`(`id`)
);

-- The collection of user entries:
CREATE TABLE `mapEntryUser` (
	`mapId`	INTEGER NOT NULL,
	`userId`	INTEGER NOT NULL,
	`x`	INTEGER NOT NULL,
	`y`	INTEGER NOT NULL,
	`contentId`	INTEGER NOT NULL,
	FOREIGN KEY(`mapId`) REFERENCES `map`(`id`),
	FOREIGN KEY(`userId`) REFERENCES `user`(`id`),
	FOREIGN KEY(`contentId`) REFERENCES `content`(`id`)
);

-- The collection of possible contents (tools) for a map tile:
CREATE TABLE `content` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`publicIdentifier`	TEXT NOT NULL,
	`name`	TEXT NOT NULL
);

-- Containts which contents (tools) are allowed in a maps:
CREATE TABLE `mapContent` (
	`mapId`	INTEGER NOT NULL,
	`contentId`	INTEGER NOT NULL,
	FOREIGN KEY(`mapId`) REFERENCES `map`(`id`),
	FOREIGN KEY(`contentId`) REFERENCES `content`(`id`)
);

-- Search by user name is important for logins:
CREATE UNIQUE INDEX `userName` ON `user` (`name`);
-- Search by map's public identifier is needed for selecting maps via URL:
CREATE UNIQUE INDEX `mapPublicIdentifier` ON `map` (`publicIdentifier`);
-- Speeding up tile searches:
CREATE INDEX `mapEntryAnonymousCoordinates` ON `mapEntryAnonymous` (`mapId`, `x`, `y`, `ip`);
-- Speeding up tile searches:
CREATE INDEX `mapEntryUserCoordinates` ON `mapEntryUser` (`mapId`, `x`, `y`, `userId`);

-- The default anonymous user, here to go sure the ID is zero and the first entry:
INSERT INTO
	`user` (`id`, `name`, `passwordHash`, `isAdmin`)
VALUES
	(0, 'anonymous', '', 0);

COMMIT;
