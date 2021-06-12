import * as fs from 'fs';
import { ContentTable } from './tables/contentTable';
import { MapContentGroupNumber } from './tables/mapContentTable';
import MapEntryAnonymousTable from './tables/mapEntryAnonymousTable';
import MapEntryUserTable from './tables/mapEntryUserTable';
import { MapTable } from './tables/mapTable';
import Sqlite = require('better-sqlite3');
import SessionTable from './tables/sessionTable';
import { UserTable } from './tables/userTable';
import Utils from '../../utility/utils';

export default class Database
{
    private readonly databaseDescriberFileName = 'karopapier';
    private readonly dataPath = './data/';

    /**
     * The database containing all tables.
     */
    private database: Sqlite.Database;

    /**
     * Initialises the database connection.
     */
    constructor (databaseFileName: string, inMemory = false)
    {
        this.database = this.openOrCreateDatabase(databaseFileName, this.databaseDescriberFileName, inMemory);
    }

    private openOrCreateDatabase (databaseName: string, describerFileName: string, inMemory: boolean): Sqlite.Database
    {
        const databaseFilePath = inMemory ? ':memory:' : this.dataPath + databaseName + '.sqlite';

        const fileCreated = inMemory || !fs.existsSync(databaseFilePath);

        const database = Sqlite(databaseFilePath);

        // WAL journal mode for better performance:
        database.pragma('journal_mode = WAL');
        // We want save data, so full synchronous:
        database.pragma('synchronous = FULL');

        if (fileCreated || inMemory)
        {
            const databaseDescriberFilePath = this.dataPath + describerFileName + '.sql';

            const sql = fs.readFileSync(databaseDescriberFilePath, 'utf8');

            try
            {
                database.exec(sql);
            }
            catch (error)
            {
                // If an error has occured here, something went wrong with the
                // sql statement. We then have to close the connection and
                // delete the file to prevent that we accidently reopen it and
                // assume it to be ready to use.
                // Because this only can happen if we created the file ourselves
                // a couple of milliseconds ago, a deletion means no data loss.

                database.close();

                if (!inMemory && fs.existsSync(databaseFilePath))
                {
                    fs.unlinkSync(databaseFilePath);
                }

                throw error;
            }
        }
        else
        {
            // If this is an old file, call vaccuum to defragment the database file:
            database.exec('VACUUM;');
        }

        // One call to optimise after each closed database connection
        // is recommended, so we do it before we open one:
        database.pragma('optimize');

        return database;
    }

    /**
     * Copies all bindable properties from an object, returning a bindable object
     * that can be used as binding parameters when running SQLite statements.
     */
    private getBindablesFromObject (object: any): any
    {
        // Objects can contain data that is not bindable for SQLite, for
        // example constructors, methods etc.
        // This spread operator shallow copies all properties from the object
        // into an empty one, leaving the methods alone.
        const bindableObject = { ...object };

        // SQLite3 does not support boolean values. So we have to convert
        // them into numbers, otherwise an error will be thrown.
        for (const [key, value] of Object.entries(bindableObject))
        {
            if ((typeof value) === 'boolean')
            {
                const valueAsNumber = value ? 1 : 0;
                bindableObject[key] = valueAsNumber;
            }
        }

        return bindableObject;
    }

    /**
     * Returns if the database has something with the given value for the given select query.
     * @param selectQuery The query to select something in the database to check if it exists.
     * @param value The value that will be given to the statement as execution parameter.
     * @returns True if something is found, otherwise false.
     */
    private hasSomething (selectQuery: string, value: any): boolean
    {
        const statement = this.database.prepare(
            `SELECT
                CASE
                    WHEN EXISTS
                        (${selectQuery} LIMIT 1)
                    THEN 1
                    ELSE 0
                END`
        );

        // Will make the get method to return the value of the first column instead of an object for all
        // columns. Since we only want one value this makes it much easier:
        statement.pluck(true);

        const result: boolean = statement.get(value); // FIXME: The booleans are numbers inside the database!

        return result;
    }

    /**
     * Close the database connection.
     */
    public close (): void
    {
        this.database.close();
    }

    public getUser (userId: number): UserTable
    {
        const statement = this.database.prepare(
            'SELECT * FROM user WHERE id = ?'
        );

        const user: UserTable = statement.get(userId);

        return user;
    }

    public getUserByName (userName: string): UserTable
    {
        const statement = this.database.prepare(
            'SELECT * FROM user WHERE name = ?'
        );

        const user: UserTable = statement.get(userName);

        return user;
    }

    /**
     * Insert a new session into the database.
     * @param userId The user ID for the user this session will be associated with.
     * @param token The unique token for the session.
     */
    public insertSession (userId: number, token: string): SessionTable
    {
        const statement = this.database.prepare(
            `INSERT INTO
                contact (userId, token, lastAccess)
            VALUES
                (:userId, :token, :lastAccess)`
        );

        const insertObject = {
            userId: userId,
            token: token,
            lastAccess: Utils.getCurrentUnixTime()
        };

        const runResult = statement.run(insertObject);

        const sessionTable: SessionTable = {
            ...insertObject,
            id: runResult.lastInsertRowid as number
        };

        return sessionTable;
    }

    public getSession (sessionId: number): SessionTable
    {
        const statement = this.database.prepare(
            'SELECT * FROM session WHERE id = ?'
        );

        const session: SessionTable = statement.get(sessionId);

        return session;
    }

    public updateSessionAccessTime (sessionId: number): void
    {
        const statement = this.database.prepare(
            `UPDATE
                session
            SET
                lastAccess = ?
            WHERE
                id = ?`
        );

        const currentUnixTime = Utils.getCurrentUnixTime();

        statement.run(currentUnixTime, sessionId);
    }

    public deleteSession (sessionId: number): void
    {
        const statement = this.database.prepare(
            'DELETE FROM session WHERE id = ?'
        );

        statement.run(sessionId);
    }

    public hasMap (mapId: number): boolean
    {
        const selectQuery = 'SELECT 1 FROM map WHERE id = ?';

        const result = this.hasSomething(selectQuery, mapId);

        return result;
    }

    public hasMapPublicIdentifier (publicIdentifier: string): boolean
    {
        const selectQuery = 'SELECT 1 FROM map WHERE publicIdentifier = ?';

        const result = this.hasSomething(selectQuery, publicIdentifier);

        return result;
    }

    /**
     * Get a map by it's ID.
     * @returns The map.
     */
    public getMap (mapId: number): MapTable
    {
        const statement = this.database.prepare(
            'SELECT * FROM map WHERE id = ?'
        );

        const map: MapTable = statement.get(mapId);

        return map;
    }

    /**
     * Get a map by it's public identifier.
     * @returns The map.
     */
    public getMapByPublicIdentifier (publicIdentifier: string): MapTable
    {
        const statement = this.database.prepare(
            'SELECT * FROM map WHERE publicIdentifier = ?'
        );

        const map: MapTable = statement.get(publicIdentifier);

        return map;
    }

    /**
     * Get all maps.
     * @returns The list of map entries.
     */
    public getMaps (): MapTable[]
    {
        const statement = this.database.prepare(
            'SELECT * FROM map'
        );

        const maps: MapTable[] = statement.all();

        return maps;
    }

    /**
     * Checks if the given content ID is available for the given map.
     * @param contentId The ID of the content to search for.
     * @param mapId The ID of the map to search in.
     * @returns True if found, otherwise false.
     */
    public hasContent (contentId: number, mapId: number): boolean
    {
        const selectQuery = 'SELECT 1 FROM mapContent WHERE mapId = ? AND contentId = ?';

        const result = this.hasSomething(selectQuery, [mapId, contentId]);

        return result;
    }

    public getContentsForMap (mapId: number): (ContentTable & MapContentGroupNumber)[]
    {
        const statement = this.database.prepare(
            `SELECT
                content.*, mapContent.groupNumber
            FROM
                mapContent
            LEFT JOIN
                content ON mapContent.contentId = content.id
            WHERE
                mapContent.mapId = ?
            ORDER BY
                mapContent.groupNumber ASC,
                content.id ASC
            `
        );

        const contents: (ContentTable & MapContentGroupNumber)[] = statement.all(mapId);

        return contents;
    }

    public getAnonymousMapEntries (mapId: number): MapEntryAnonymousTable[]
    {
        const statement = this.database.prepare(
            'SELECT * FROM mapEntryAnonymous WHERE mapId = ?'
        );

        const mapEntries: MapEntryAnonymousTable[] = statement.all(mapId);

        return mapEntries;
    }

    public insertAnonymousMapEntry (anonymousMapEntry: MapEntryAnonymousTable): void
    {
        const statement = this.database.prepare(
            `INSERT INTO
                mapEntryAnonymous (mapId, ip, x, y, contentId)
            VALUES
                (:mapId, :ip, :x, :y, :contentId)`
        );

        const insertObject = this.getBindablesFromObject(anonymousMapEntry);

        statement.run(insertObject);
    }

    public updateAnonymousMapEntry (anonymousMapEntry: MapEntryAnonymousTable): void
    {
        const statement = this.database.prepare(
            `UPDATE
                mapEntryAnonymous
            SET
                contentId = :contentId
            WHERE
                mapId = :mapId
                AND x = :x
                AND y = :y
                AND ip = :ip`
        );

        const updateObject = this.getBindablesFromObject(anonymousMapEntry);

        statement.run(updateObject);
    }

    public getUserMapEntries (mapId: number): MapEntryUserTable[]
    {
        const statement = this.database.prepare(
            'SELECT * FROM mapEntryUser WHERE mapId = ?'
        );

        const mapEntries: MapEntryUserTable[] = statement.all(mapId);

        return mapEntries;
    }

    public insertUserMapEntry (userMapEntry: MapEntryUserTable): void
    {
        const statement = this.database.prepare(
            `INSERT INTO
                mapEntryUser (mapId, userId, x, y, contentId)
            VALUES
                (:mapId, :userId, :x, :y, :contentId)`
        );

        const insertObject = this.getBindablesFromObject(userMapEntry);

        statement.run(insertObject);
    }

    public updateUserMapEntry (userMapEntry: MapEntryUserTable): void
    {
        const statement = this.database.prepare(
            `UPDATE
                mapEntryUser
            SET
                contentId = :contentId
            WHERE
                mapId = :mapId
                AND x = :x
                AND y = :y
                AND userId = :userId`
        );

        const updateObject = this.getBindablesFromObject(userMapEntry);

        statement.run(updateObject);
    }
}
