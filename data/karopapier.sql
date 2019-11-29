BEGIN TRANSACTION;

CREATE TABLE `user` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`name`	TEXT NOT NULL UNIQUE,
	`passwordHash`	TEXT NOT NULL,
	`sessionId`	TEXT,
	`isAdmin`	INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE `map` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`name`	TEXT NOT NULL UNIQUE,
	`isActive`	INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE `mapEntryAnonymous` (
	`mapId`	INTEGER NOT NULL,
	`quantity`	INTEGER NOT NULL,
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
CREATE INDEX `userSessionId` ON `user` (`sessionId`);
CREATE INDEX `mapEntryAnonymousCoordinates` ON `mapEntryAnonymous` (`mapId`, `x`, `y`);
CREATE INDEX `mapEntryUserCoordinates` ON `mapEntryUser` (`mapId`, `x`, `y`);

INSERT INTO
	`user` (`id`, `name`, `passwordHash`, `sessionId`, `isAdmin`)
VALUES
	(0, 'anonymous', '', '', 0);

COMMIT;
