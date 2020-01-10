BEGIN TRANSACTION;

CREATE TABLE `user` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`name`	TEXT NOT NULL UNIQUE,
	`passwordHash`	TEXT NOT NULL,
	`isAdmin`	INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE `session` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`userId`	INTEGER NOT NULL,
	`token`	TEXT NOT NULL UNIQUE,
	`lastAccess`	INTEGER NOT NULL,
	FOREIGN KEY(`userId`) REFERENCES `user`(`id`),
);

CREATE TABLE `map` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`publicIdentifier`	TEXT NOT NULL UNIQUE,
	`name`	TEXT NOT NULL,
	`isActive`	INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE `mapEntryAnonymous` (
	`mapId`	INTEGER NOT NULL,
	`ip`	TEXT NOT NULL,
	`x`	INTEGER NOT NULL,
	`y`	INTEGER NOT NULL,
	`content`	INTEGER NOT NULL,
	FOREIGN KEY(`mapId`) REFERENCES `map`(`id`)
);

CREATE TABLE `mapEntryUser` (
	`mapId`	INTEGER NOT NULL,
	`userId`	INTEGER NOT NULL,
	`x`	INTEGER NOT NULL,
	`y`	INTEGER NOT NULL,
	`content`	INTEGER NOT NULL,
	FOREIGN KEY(`mapId`) REFERENCES `map`(`id`),
	FOREIGN KEY(`userId`) REFERENCES `user`(`id`)
);

CREATE UNIQUE INDEX `userName` ON `user` (`name`);
CREATE UNIQUE INDEX `mapPublicIdentifier` ON `map` (`publicIdentifier`);
CREATE INDEX `mapEntryAnonymousCoordinates` ON `mapEntryAnonymous` (`mapId`, `x`, `y`);
CREATE INDEX `mapEntryUserCoordinates` ON `mapEntryUser` (`mapId`, `x`, `y`);

INSERT INTO
	`user` (`id`, `name`, `passwordHash`, `isAdmin`)
VALUES
	(0, 'anonymous', '', 0);

COMMIT;
