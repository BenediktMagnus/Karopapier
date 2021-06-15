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
    FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
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

-- The collection of map entries (for every user and map tile):
CREATE TABLE `mapEntry` (
    `mapId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL DEFAULT 0,
    `sessionId` INTEGER,
    `ip` TEXT,
    `x` INTEGER NOT NULL,
    `y` INTEGER NOT NULL,
    `contentId` INTEGER NOT NULL,
    FOREIGN KEY(`mapId`) REFERENCES `map`(`id`) ON DELETE CASCADE,
    FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE SET DEFAULT, -- On DELETE, set the userId to 0 which is the anonymous user.
    FOREIGN KEY(`sessionId`) REFERENCES `session`(`id`) ON DELETE SET NULL,
    FOREIGN KEY(`contentId`) REFERENCES `content`(`id`) ON DELETE CASCADE
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
CREATE INDEX `mapEntryCoordinates` ON `mapEntry` (`mapId`, `x`, `y`);
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
    (0, 'empty', 'Empty'),
    (1, 'transparent', 'Transparent'),
    (2, 'path', 'Path'),
    (3, 'door_top', 'Door top'),
    (4, 'door_bottom', 'Door bottom'),
    (5, 'door_left', 'Door left'),
    (6, 'door_right', 'Door right'),
    (7, 'stairs_up', 'Stairs up'),
    (8, 'stairs_down', 'Stairs down'),
    (9, 'plate', 'Plate'),
    (10, 'arrow_up', 'Arrow up'),
    (11, 'arrow_down', 'Arrow down'),
    (12, 'arrow_left', 'Arrow left'),
    (13, 'arrow_right', 'Arrow right');

COMMIT;
