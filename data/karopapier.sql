BEGIN TRANSACTION;

-- The classical user table with credentials:
CREATE TABLE `user` (
    `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    `name` TEXT NOT NULL UNIQUE,
    `passwordHash` TEXT NOT NULL,
    `isAdmin` INTEGER NOT NULL DEFAULT 0
);

-- Sessions are used to identify users after their login:
CREATE TABLE `session` (
    `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    `userId` INTEGER NOT NULL,
    `token` TEXT NOT NULL UNIQUE,
    `lastAccess` INTEGER NOT NULL,
    FOREIGN KEY(`userId`) REFERENCES `user`(`id`)
);

-- Maps and their meta data:
CREATE TABLE `map` (
    `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    `publicIdentifier` TEXT NOT NULL UNIQUE, -- Valid URL query string, used to identify the map in URLs as human readable as possible.
    `name` TEXT NOT NULL, -- Human readable name for the map.
    `isActive` INTEGER NOT NULL DEFAULT 1,
    `width` INTEGER NOT NULL,
    `height` INTEGER NOT NULL
);

-- The collection of anonymous entries:
CREATE TABLE `mapEntryAnonymous` (
    `mapId` INTEGER NOT NULL,
    `ip` TEXT NOT NULL,
    `x` INTEGER NOT NULL,
    `y` INTEGER NOT NULL,
    `contentId` INTEGER NOT NULL,
    FOREIGN KEY(`mapId`) REFERENCES `map`(`id`),
    FOREIGN KEY(`contentId`) REFERENCES `content`(`id`)
);

-- The collection of user entries:
CREATE TABLE `mapEntryUser` (
    `mapId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `x` INTEGER NOT NULL,
    `y` INTEGER NOT NULL,
    `contentId` INTEGER NOT NULL,
    FOREIGN KEY(`mapId`) REFERENCES `map`(`id`),
    FOREIGN KEY(`userId`) REFERENCES `user`(`id`),
    FOREIGN KEY(`contentId`) REFERENCES `content`(`id`)
);

-- The collection of possible contents (tools) for a map tile:
CREATE TABLE `content` (
    `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    `publicIdentifier` TEXT NOT NULL UNIQUE, -- Machine readable identifier for the content used in contact with other programmes.
    `name` TEXT NOT NULL -- Human readable name for the content.
);

-- Contains which contents (tools) are allowed in a map:
CREATE TABLE `mapContent` (
    `mapId` INTEGER NOT NULL,
    `contentId` INTEGER NOT NULL,
    `groupNumber` INTEGER NOT NULL, -- The number of the group this content is associated with. Used to structure the toolbox.
    FOREIGN KEY(`mapId`) REFERENCES `map`(`id`),
    FOREIGN KEY(`contentId`) REFERENCES `content`(`id`)
);

-- Speeding up tile searches:
CREATE INDEX `mapEntryAnonymousCoordinates` ON `mapEntryAnonymous` (`mapId`, `x`, `y`, `ip`);
-- Speeding up tile searches:
CREATE INDEX `mapEntryUserCoordinates` ON `mapEntryUser` (`mapId`, `x`, `y`, `userId`);
-- Speeding up content searches:
CREATE UNIQUE INDEX `mapContentAssociation` ON `mapContent` (`mapId`, `contentId`);

-- The default anonymous user, the first entry in the table with ID zero and no password:
INSERT INTO
    `user` (`id`, `name`, `passwordHash`, `isAdmin`)
VALUES
    (0, 'anonymous', '', 0);

-- The standard map contents for generic use:
INSERT INTO
    `content` (`id`, `publicIdentifier`, `name`)
VALUES
    (0, '', 'Empty'),
    (1, '', 'Transparent'),
    (2, '', 'Path'),
    (3, '', 'Door top'),
    (4, '', 'Door down'),
    (5, '', 'Door left'),
    (6, '', 'Door right'),
    (7, '', 'Stairs up'),
    (8, '', 'Stairs down'),
    (9, '', 'Plate'),
    (10, '', 'Arrow top'),
    (11, '', 'Arrow down'),
    (12, '', 'Arrow left'),
    (13, '', 'Arrow right');

COMMIT;
